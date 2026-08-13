import { ProgrammaticUnit, LessonPlanItem, ScheduleItem } from "../types/syllabus";
import { SchoolCalendarEvent, TeacherWeeklyRule, INITIAL_SCHOOL_EVENTS_2026, TEACHER_SCHEDULE_RULES } from "./calendarConfig";

export function generateSyllabusSchedule(
  units: ProgrammaticUnit[],
  schoolEvents: SchoolCalendarEvent[] = INITIAL_SCHOOL_EVENTS_2026,
  teacherRules: TeacherWeeklyRule[] = TEACHER_SCHEDULE_RULES
): { updatedUnits: ProgrammaticUnit[]; masterSchedule: ScheduleItem[] } {
  // Map of event date -> event
  const eventsByDate: Record<string, SchoolCalendarEvent> = {};
  schoolEvents.forEach((ev) => {
    eventsByDate[ev.date] = ev;
  });

  // Track lesson plan counters and accumulated hours per UC
  const ucLessonCounters: Record<string, number> = {};
  const ucAccumulatedHours: Record<string, number> = {};

  // Map predefined lesson plans if present
  const hasPredefinedLessonPlan: Record<string, boolean> = {};

  // Clone units to assign lessonPlan arrays
  const updatedUnits = units.map((u) => {
    ucLessonCounters[u.id] = 0;
    ucAccumulatedHours[u.id] = 0;
    if (u.lessonPlan && u.lessonPlan.length > 0) {
      hasPredefinedLessonPlan[u.id] = true;
      return { ...u, lessonPlan: [...u.lessonPlan] };
    }
    hasPredefinedLessonPlan[u.id] = false;
    return { ...u, lessonPlan: [] as LessonPlanItem[] };
  });

  const masterSchedule: ScheduleItem[] = [];
  let globalClassNum = 1;

  // Helper to parse max workload hours (e.g. "40h" -> 40, "240h" -> 240)
  const getMaxHours = (u: ProgrammaticUnit): number => {
    const parsed = parseInt((u.workload || "").replace(/\D/g, ""), 10);
    return isNaN(parsed) ? 80 : parsed;
  };

  // Helper to find unit by acronym
  const findUnitByAcronym = (acronym: string): ProgrammaticUnit | undefined => {
    return updatedUnits.find((u) => {
      const acr = (u.acronym || u.unitTitle).toUpperCase();
      if (acronym === "CRD" || acronym === "CDMAT") {
        return acr.includes("CRD") || acr.includes("CONTROLE") || acr.includes("CDMAT");
      }
      if (acronym === "MAP") {
        return acr.includes("MAP") || acr.includes("MATEMÁTICA") || acr.includes("MATEMATICA");
      }
      if (acronym === "CIEMA") {
        return acr.includes("CIEMA") || acr.includes("MATERIAIS");
      }
      return acr.includes(acronym);
    });
  };

  // Date loop: 2026-01-26 to 2026-12-18
  const startDate = new Date(2026, 0, 26); // Jan 26, 2026
  const endDate = new Date(2026, 11, 18);   // Dec 18, 2026

  const curr = new Date(startDate);

  while (curr <= endDate) {
    const isoDate = curr.toISOString().split("T")[0];
    const month = curr.getMonth(); // 0-11
    const dayOfMonth = curr.getDate();
    let dayOfWeek = curr.getDay(); // 0=Dom, 1=Seg... 6=Sáb

    // Check if within 1º Semestre (Jan - Jun) or 2º Semestre (Jul - Dec)
    const semester: "1º SEMESTRE" | "2º SEMESTRE" = month < 6 ? "1º SEMESTRE" : "2º SEMESTRE";

    // Skip July vacation / recess before July 22nd
    if (month === 6 && dayOfMonth < 22) {
      curr.setDate(curr.getDate() + 1);
      continue;
    }

    const event = eventsByDate[isoDate];

    // Skip if holiday or suspension (unless it's a compensation Saturday or balance day)
    if (event && (event.type === "feriado" || event.type === "suspensao")) {
      curr.setDate(curr.getDate() + 1);
      continue;
    }

    // Handle balance days (e.g. Wednesday behaving like Monday)
    if (event && event.type === "balanceamento" && event.balanceForDayOfWeek) {
      dayOfWeek = event.balanceForDayOfWeek;
    }

    // Only process Monday to Friday (1..5) or Compensation Saturday (6) if event says compensation
    const isCompensationSaturday = dayOfWeek === 6 && event && event.type === "compensacao";
    
    if ((dayOfWeek >= 1 && dayOfWeek <= 5) || isCompensationSaturday) {
      // Find rules for this day and semester
      const activeRules = teacherRules.filter(
        (r) => r.semester === semester && r.dayOfWeek === (isCompensationSaturday ? 5 : dayOfWeek) // saturday acts like Friday by default
      );

      activeRules.forEach((rule) => {
        const targetUnit = findUnitByAcronym(rule.ucAcronym);
        if (targetUnit) {
          const uIdx = updatedUnits.findIndex((u) => u.id === targetUnit.id);
          if (uIdx !== -1) {
            const currentUnitObj = updatedUnits[uIdx];
            const maxHours = getMaxHours(currentUnitObj);
            const currentHours = ucAccumulatedHours[currentUnitObj.id];

            // If UC has already reached or exceeded official workload, skip scheduling
            if (currentHours >= maxHours) {
              return;
            }

            const currentCount = ucLessonCounters[currentUnitObj.id] + 1;
            currentUnitObj.lessonPlan = currentUnitObj.lessonPlan || [];
            const existingItem = currentUnitObj.lessonPlan[currentCount - 1];

            const itemHours = existingItem && existingItem.hours ? (parseInt(existingItem.hours.replace(/\D/g, ""), 10) || 4) : 0;
            const defaultRuleHours = parseInt(rule.hours.replace(/\D/g, ""), 10) || 4;
            const hoursVal = itemHours > 0 ? itemHours : defaultRuleHours;

            const hoursToAdd = Math.min(hoursVal, maxHours - currentHours);
            ucAccumulatedHours[currentUnitObj.id] = currentHours + hoursToAdd;
            ucLessonCounters[currentUnitObj.id] = currentCount;

            // Generate realistic topic name based on topics list
            const topicsList = currentUnitObj.topics || [];
            const topicIndex = (currentCount - 1) % Math.max(1, topicsList.length);
            const topicText = topicsList[topicIndex] || `Aula ${currentCount} de ${currentUnitObj.unitTitle}`;

            // Format date for lesson plan (DD/MM/YYYY)
            const [y, m, d] = isoDate.split("-");
            const brDate = `${d}/${m}/${y}`;

            let topicName = topicText;

            if (!existingItem) {
              const lessonItem: LessonPlanItem = {
                id: `${currentUnitObj.id}-aula-${currentCount}`,
                date: brDate,
                hours: `${hoursToAdd}h`,
                capacities: "Desenvolver competências técnicas e socioemocionais",
                conhecimentos: topicText,
                estrategias: `Exposição dialogada e prática com ${rule.professor}`,
                recursos: "Ambientes pedagógicos, oficinas e laboratórios SENAI",
                professor: rule.professor,
                status: "planejada",
              };
              currentUnitObj.lessonPlan.push(lessonItem);
            } else {
              if (existingItem.conhecimentos) {
                topicName = existingItem.conhecimentos;
              }
              if (!existingItem.date) {
                existingItem.date = brDate;
              }
            }

            // Add to master schedule
            masterSchedule.push({
              id: `sched-${globalClassNum}`,
              classNumber: globalClassNum++,
              weekNumber: Math.ceil((curr.getTime() - startDate.getTime()) / (7 * 24 * 3600 * 1000)) + 1,
              date: isoDate,
              topic: `${currentUnitObj.acronym || currentUnitObj.unitTitle}: ${topicName}`,
              unit: currentUnitObj.unitTitle,
              type: hoursToAdd >= 4 ? "pratica" : "teorica",
              status: "planejada",
              professor: rule.professor,
              activities: `Acompanhamento com ${rule.professor}`,
            });
          }
        }
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  return { updatedUnits, masterSchedule };
}
