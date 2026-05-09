"use client";

import { useEffect } from "react";
import { useCalendarStore } from "@/modules/calendar/store/calendar-store";

export function useCalendar() {
  useEffect(() => {
    void useCalendarStore.getState().load();
  }, []);
  return useCalendarStore();
}
