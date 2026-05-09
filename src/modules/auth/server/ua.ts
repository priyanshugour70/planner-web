import { UAParser } from "ua-parser-js";

export function parseUa(ua: string | null | undefined) {
  if (!ua) {
    return {
      deviceType: "unknown",
      platform: "unknown",
      browser: "unknown",
      os: "unknown",
    };
  }
  const p = new UAParser(ua);
  const r = p.getResult();
  return {
    deviceType: r.device.type ?? "desktop",
    platform: r.cpu.architecture ?? r.os.name ?? "unknown",
    browser: [r.browser.name, r.browser.version].filter(Boolean).join(" ") || "unknown",
    os: [r.os.name, r.os.version].filter(Boolean).join(" ") || "unknown",
  };
}
