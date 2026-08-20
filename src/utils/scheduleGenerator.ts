import { ProgrammaticUnit, LessonPlanItem, ScheduleItem } from "../types/syllabus";
import { SchoolCalendarEvent, TeacherWeeklyRule, INITIAL_SCHOOL_EVENTS_2026, TEACHER_SCHEDULE_RULES } from "./calendarConfig";
import { parseDateToISO } from "./calendarUtils";

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

  // Track lesson plan counters and accumulated hours per UC + Professor
  const ucProfLessonCounters: Record<string, number> = {};
  const ucProfAccumulatedHours: Record<string, number> = {};

  // Clone units to assign lessonPlan arrays
  const updatedUnits = units.map((u) => {
    return { ...u, lessonPlan: u.lessonPlan ? [...u.lessonPlan] : ([] as LessonPlanItem[]) };
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
  const startDate = new Date(2026, 0, 26, 12, 0, 0); // Jan 26, 2026 (noon to avoid DST/timezone issues)
  const endDate = new Date(2026, 11, 18, 12, 0, 0);   // Dec 18, 2026

  const curr = new Date(startDate);

  // Store new clean lesson plans per unit during generation
  const newLessonPlansPerUnit: Record<string, LessonPlanItem[]> = {};
  updatedUnits.forEach((u) => {
    newLessonPlansPerUnit[u.id] = [];
  });

  while (curr <= endDate) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, "0");
    const d = String(curr.getDate()).padStart(2, "0");
    const isoDate = `${y}-${m}-${d}`;
    const brDate = `${d}/${m}/${y}`;

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
      const effectiveDayOfWeek = isCompensationSaturday ? (event?.balanceForDayOfWeek || 5) : dayOfWeek;
      // Find rules for this day and semester
      const activeRules = teacherRules.filter(
        (r) => r.semester === semester && r.dayOfWeek === effectiveDayOfWeek
      );

      activeRules.forEach((rule) => {
        const targetUnit = findUnitByAcronym(rule.ucAcronym);
        if (targetUnit) {
          const uIdx = updatedUnits.findIndex((u) => u.id === targetUnit.id);
          if (uIdx !== -1) {
            const currentUnitObj = updatedUnits[uIdx];
            const maxHours = getMaxHours(currentUnitObj);
            const profKey = `${currentUnitObj.id}::${rule.professor}`;
            const currentHours = ucProfAccumulatedHours[profKey] || 0;

            // If UC has already reached or exceeded official workload for this professor, skip scheduling
            if (currentHours >= maxHours) {
              return;
            }

            const currentCount = (ucProfLessonCounters[profKey] || 0) + 1;
            const profSlug = rule.professor.toLowerCase().includes("gea") ? "gea" : "beretella";
            const lessonItemId = `${currentUnitObj.id}-${profSlug}-aula-${currentCount}`;
            
            // Check if user previously edited this lesson's custom content
            const existingItem = (currentUnitObj.lessonPlan || []).find(
              (lp) => lp.id === lessonItemId || (lp.professor === rule.professor && lp.id?.endsWith(`-aula-${currentCount}`))
            );

            const ruleHours = parseInt(rule.hours.replace(/\D/g, ""), 10) || 4;
            const hoursToAdd = Math.min(ruleHours, maxHours - currentHours);
            ucProfAccumulatedHours[profKey] = currentHours + hoursToAdd;
            ucProfLessonCounters[profKey] = currentCount;

            // Find template lesson from stages or unit template
            let templateLesson: LessonPlanItem | undefined = undefined;
            if (currentUnitObj.stages && currentUnitObj.stages.length > 0) {
              const allStageLessons = currentUnitObj.stages.flatMap((st) => st.lessonPlan || []);
              if (allStageLessons.length > 0) {
                templateLesson = allStageLessons[(currentCount - 1) % allStageLessons.length];
              }
            }

            // Generate realistic topic and capacities based on template or lists
            const topicsList = currentUnitObj.topics || [];
            const topicIndex = (currentCount - 1) % Math.max(1, topicsList.length);
            const defaultTopic = templateLesson?.conhecimentos || topicsList[topicIndex] || `Aula ${currentCount} de ${currentUnitObj.unitTitle}`;
            const topicText = existingItem && existingItem.conhecimentos ? existingItem.conhecimentos : defaultTopic;

            const defaultCapacities = templateLesson?.capacities ||
              (currentUnitObj.technicalCapacities && currentUnitObj.technicalCapacities.length > 0
                ? currentUnitObj.technicalCapacities[(currentCount - 1) % currentUnitObj.technicalCapacities.length]
                : currentUnitObj.basicCapacities?.[(currentCount - 1) % (currentUnitObj.basicCapacities.length || 1)] ||
                  "Desenvolver competências técnicas e socioemocionais");
            const capacitiesText = existingItem && existingItem.capacities ? existingItem.capacities : defaultCapacities;

            const defaultEstrategias = templateLesson?.estrategias ||
              `Exposição dialogada, resolução da Situação-Problema e prática de oficina supervisionada com ${rule.professor}.`;
            const estrategiasText = existingItem && existingItem.estrategias ? existingItem.estrategias : defaultEstrategias;

            const defaultRecursos = templateLesson?.recursos ||
              "Oficina de Usinagem / Laboratório SENAI, máquinas operatrizes, ferramentas de corte, instrumentos de medição e EPIs.";
            const recursosText = existingItem && existingItem.recursos ? existingItem.recursos : defaultRecursos;

            const lessonItem: LessonPlanItem = {
              id: lessonItemId,
              date: existingItem?.date || brDate, // Preserve user-edited date or use calendar date
              hours: existingItem?.hours || `${hoursToAdd}h`,
              capacities: capacitiesText,
              conhecimentos: topicText,
              estrategias: estrategiasText,
              recursos: recursosText,
              professor: existingItem?.professor || rule.professor,
              status: existingItem?.status || "planejada",
            };

            newLessonPlansPerUnit[currentUnitObj.id].push(lessonItem);

            // Add to master schedule
            const scheduleDate = existingItem?.date ? (parseDateToISO(existingItem.date) || isoDate) : isoDate;
            masterSchedule.push({
              id: `sched-${globalClassNum}`,
              classNumber: globalClassNum++,
              weekNumber: Math.ceil((curr.getTime() - startDate.getTime()) / (7 * 24 * 3600 * 1000)) + 1,
              date: scheduleDate,
              topic: `${currentUnitObj.acronym || currentUnitObj.unitTitle}: ${topicText}`,
              unit: currentUnitObj.unitTitle,
              type: hoursToAdd >= 4 ? "pratica" : "teorica",
              status: lessonItem.status,
              professor: rule.professor,
              activities: `Acompanhamento com ${rule.professor}`,
            });
          }
        }
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  // Update units with their clean synchronized lesson plans, respecting max workload limit
  updatedUnits.forEach((u) => {
    const maxWorkload = getMaxHours(u);
    const generatedList = newLessonPlansPerUnit[u.id] || [];
    
    // Calculate total hours in generated list
    let accumulated = 0;
    const cleanList: LessonPlanItem[] = [];
    
    for (const item of generatedList) {
      const h = parseInt(String(item.hours || "4").replace(/\D/g, ""), 10) || 4;
      if (accumulated + h <= maxWorkload) {
        cleanList.push(item);
        accumulated += h;
      }
    }
    
    u.lessonPlan = cleanList;
  });

  return { updatedUnits, masterSchedule };
}
