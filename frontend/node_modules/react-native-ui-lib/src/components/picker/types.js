// TODO: Replace with new TextField Props after migration to new TextField has completed

// Note: enum values are uppercase due to legacy
export let PickerModes;
(function (PickerModes) {
  PickerModes["SINGLE"] = "SINGLE";
  PickerModes["MULTI"] = "MULTI";
})(PickerModes || (PickerModes = {}));
export let PickerFieldTypes;
(function (PickerFieldTypes) {
  PickerFieldTypes["form"] = "form";
  PickerFieldTypes["filter"] = "filter";
  PickerFieldTypes["settings"] = "settings";
})(PickerFieldTypes || (PickerFieldTypes = {}));