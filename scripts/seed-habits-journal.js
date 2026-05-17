const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

// Load .env and .env.local manually
function loadEnv() {
  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env or .env.local");
  process.exit(1);
}

const DEFAULT_EMAIL = "priyanshugour1@gmail.com";

function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function main() {
  const email = (process.env.SEED_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const force = process.argv.includes("--force");
  
  // Connect to DB (direct URL or pooler,prepare false matches app expectations)
  const sql = postgres(dbUrl, { max: 1, prepare: false, ssl: "require" });

  const [user] = await sql`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`;
  if (!user) {
    console.error(`No user with email "${email}". Sign up first, then re-run.`);
    await sql.end();
    process.exit(1);
  }
  const uid = user.id;

  if (force) {
    console.log(`Removing all habits, entries, and journal logs for user ${uid}…`);
    await sql`DELETE FROM habit_entries WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ${uid})`;
    await sql`DELETE FROM habits WHERE user_id = ${uid}`;
    await sql`DELETE FROM journal_entries WHERE user_id = ${uid}`;
  } else {
    const [{ hc }] = await sql`SELECT COUNT(*)::int AS hc FROM habits WHERE user_id = ${uid}`;
    const [{ jc }] = await sql`SELECT COUNT(*)::int AS jc FROM journal_entries WHERE user_id = ${uid}`;
    if (hc > 0 || jc > 0) {
      console.log(`User already has data (${hc} habits, ${jc} journals). Re-run with --force to replace.`);
      await sql.end();
      return;
    }
  }

  console.log(`Seeding Habits and Journal for ${email} (user_id=${uid})…`);

  const habitsToSeed = [
    { name: "Morning Meditation", description: "10 mins mindfulness breath focus", color: "#6C8CFF", icon: "body-outline", frequency: "daily", targetPerWeek: 7 },
    { name: "Hydrate (3L Water)", description: "Drink a glass every 2 hours", color: "#3DD68C", icon: "water-outline", frequency: "daily", targetPerWeek: 7 },
    { name: "Gym Workout", description: "Weight training or high intensity cardio", color: "#F07167", icon: "barbell-outline", frequency: "weekly", targetPerWeek: 4 },
    { name: "Read Books", description: "Read at least 15 pages of non-fiction", color: "#F5C15C", icon: "book-outline", frequency: "daily", targetPerWeek: 5 },
    { name: "No Sugar", description: "Avoid processed sugars and soft drinks", color: "#E0A458", icon: "heart-outline", frequency: "daily", targetPerWeek: 6 },
    { name: "Code Side Project", description: "Write code for personal projects", color: "#6C8CFF", icon: "code-slash-outline", frequency: "weekly", targetPerWeek: 3 },
  ];

  const seededHabits = [];
  for (const h of habitsToSeed) {
    const [habit] = await sql`
      INSERT INTO habits (user_id, name, description, color, icon, frequency, target_per_week, archived, start_date)
      VALUES (${uid}, ${h.name}, ${h.description}, ${h.color}, ${h.icon}, ${h.frequency}, ${h.targetPerWeek}, false, ${daysAgo(14).toISOString().slice(0, 10)})
      RETURNING id
    `;
    seededHabits.push({ id: habit.id, ...h });
  }

  console.log("Logging historical habit entries...");
  for (const habit of seededHabits) {
    const completionProbability = habit.targetPerWeek / 7;
    for (let day = 0; day < 14; day++) {
      if (Math.random() <= completionProbability) {
        const dateStr = daysAgo(day).toISOString().slice(0, 10);
        await sql`
          INSERT INTO habit_entries (habit_id, entry_date, count, note)
          VALUES (${habit.id}, ${dateStr}, 1, 'Completed today!')
        `;
      }
    }
  }

  console.log("Logging journal entries...");
  const journalsToSeed = [
    { title: "Productive Sync and Quick Wins", body: "Had a great team sync today. We resolved the blocking issue on the core server deployment and pushed the updates to production. Feels amazing to get this out of the way! Looking forward to diving into the mobile screens next.", mood: "excited", energyLevel: 5, weather: "sunny", location: "San Francisco" },
    { title: "Reflective Evening", body: "Took a long walk in the evening. Realized I need to improve my morning routine to avoid starting the day in a rush. Spent some time outlining a better layout of habits. Need to stay consistent.", mood: "neutral", energyLevel: 3, weather: "cloudy", location: "San Francisco" },
    { title: "Feeling Quite Tired Today", body: "Sleep quality wasn't the best last night. Had a hard time focusing in the afternoon. Decided to take it easy and handle administrative tasks rather than heavy coding. Rest is essential.", mood: "tired", energyLevel: 2, weather: "rainy", location: "San Francisco" },
    { title: "An Incredible Milestone reached!", body: "The notes autosave implementation worked perfectly on first run! The feedback from testing was super positive. It feels highly polished and ready for our users. Celebrating this quick win!", mood: "happy", energyLevel: 5, weather: "sunny", location: "San Francisco" },
    { title: "Focus Day & Deep Work", body: "No meetings today. Blocked out 4 hours of deep focus. Managed to fully build the backend structure for notes and journal integrations. Feels so good to build in flow.", mood: "happy", energyLevel: 4, weather: "windy", location: "San Francisco" },
    { title: "Weekly Planning & Strategy", body: "Dedicated today to high level planning. Reviewed current goals and adjusted milestones. It is easy to get lost in details, so stepping back was very helpful.", mood: "excited", energyLevel: 4, weather: "sunny", location: "San Francisco" },
  ];

  for (let i = 0; i < journalsToSeed.length; i++) {
    const j = journalsToSeed[i];
    const dateStr = daysAgo(i * 2).toISOString().slice(0, 10);
    await sql`
      INSERT INTO journal_entries (user_id, title, body, mood, entry_date, tags, is_favorite, word_count, energy_level, weather, location)
      VALUES (
        ${uid},
        ${j.title},
        ${j.body},
        ${j.mood},
        ${dateStr},
        ${["personal", "work", "progress"]},
        ${i === 0 || i === 3},
        ${j.body.split(/\s+/).length},
        ${j.energyLevel},
        ${j.weather},
        ${j.location}
      )
    `;
  }

  console.log("Seed successful.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
