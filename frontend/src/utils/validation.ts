import { extend, withValidation } from "vee-validate";
import Vue from "vue";

extend("required", {
	validate: (val: any) => !!val,
	message: "Must not be empty.",
	computesRequired: true
});

extend("padId", {
	validate: (id: string) => !id.includes("/"),
	message: "May not contain a slash."
});

extend("colour", {
	validate: (colour: string) => !!colour.match(/^[a-fA-F0-9]{3}([a-fA-F0-9]{3})?$/),
	message: "Needs to be in 3-digit or 6-digit hex format, for example <code>f00</code> or <code>0000ff</code>."
});

export type ValidationContext = Parameters<Exclude<Parameters<typeof withValidation>[1], undefined>>[0];

export function getValidationState(v: ValidationContext): boolean | null {
	return v.dirty || v.validated ? v.valid : null;
}

Vue.filter('validationState', getValidationState);