import React from 'react';
export let WizardStepStates;
(function (WizardStepStates) {
  WizardStepStates["ENABLED"] = "enabled";
  WizardStepStates["DISABLED"] = "disabled";
  WizardStepStates["ERROR"] = "error";
  WizardStepStates["SKIPPED"] = "skipped";
  WizardStepStates["COMPLETED"] = "completed";
})(WizardStepStates || (WizardStepStates = {}));
// @ts-ignore
class WizardTypesForDocs extends React.Component {
  // eslint-disable-line
  static displayName = 'Wizard';
  render() {
    return null;
  }
}

// @ts-ignore
class WizardStepTypesForDocs extends React.Component {
  // eslint-disable-line
  static displayName = 'Wizard.Step';
  render() {
    return null;
  }
}