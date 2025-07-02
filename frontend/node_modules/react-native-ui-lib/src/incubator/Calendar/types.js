export let FirstDayOfWeek;
(function (FirstDayOfWeek) {
  FirstDayOfWeek[FirstDayOfWeek["SUNDAY"] = 0] = "SUNDAY";
  FirstDayOfWeek[FirstDayOfWeek["MONDAY"] = 1] = "MONDAY";
  FirstDayOfWeek[FirstDayOfWeek["SATURDAY"] = 6] = "SATURDAY";
})(FirstDayOfWeek || (FirstDayOfWeek = {}));
export let UpdateSource;
(function (UpdateSource) {
  UpdateSource[UpdateSource["INIT"] = 0] = "INIT";
  UpdateSource[UpdateSource["DAY_SELECT"] = 1] = "DAY_SELECT";
  UpdateSource[UpdateSource["MONTH_ARROW"] = 2] = "MONTH_ARROW";
  UpdateSource[UpdateSource["MONTH_SCROLL"] = 3] = "MONTH_SCROLL";
  UpdateSource[UpdateSource["WEEK_ARROW"] = 4] = "WEEK_ARROW";
  UpdateSource[UpdateSource["WEEK_SCROLL"] = 5] = "WEEK_SCROLL";
  UpdateSource[UpdateSource["AGENDA_SCROLL"] = 6] = "AGENDA_SCROLL";
  UpdateSource[UpdateSource["TODAY_PRESS"] = 7] = "TODAY_PRESS";
  UpdateSource[UpdateSource["PROP_UPDATE"] = 8] = "PROP_UPDATE";
})(UpdateSource || (UpdateSource = {}));
export let DayNamesFormat;
(function (DayNamesFormat) {
  DayNamesFormat[DayNamesFormat["DEFAULT"] = 0] = "DEFAULT";
  DayNamesFormat[DayNamesFormat["LONG_ABBREVIATION"] = 1] = "LONG_ABBREVIATION";
  DayNamesFormat[DayNamesFormat["SHORT_ABBREVIATION"] = 2] = "SHORT_ABBREVIATION";
})(DayNamesFormat || (DayNamesFormat = {})); // export interface AgendaProps {
//   // Type: list(events)/timeline
//   // layout:
//   // scrollTo(date)
// }