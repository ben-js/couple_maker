export let StateTypes;
(function (StateTypes) {
  StateTypes["CURRENT"] = "current";
  StateTypes["NEXT"] = "next";
  StateTypes["ERROR"] = "error";
  StateTypes["SUCCESS"] = "success";
})(StateTypes || (StateTypes = {}));
export let LineTypes;
(function (LineTypes) {
  LineTypes["SOLID"] = "solid";
  LineTypes["DASHED"] = "dashed";
})(LineTypes || (LineTypes = {}));
export let PointTypes;
(function (PointTypes) {
  PointTypes["BULLET"] = "bullet";
  PointTypes["CIRCLE"] = "circle";
  PointTypes["OUTLINE"] = "outline";
})(PointTypes || (PointTypes = {}));