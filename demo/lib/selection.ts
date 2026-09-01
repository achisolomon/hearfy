import { useSyncExternalStore } from "react";
import { devices } from "./mock-data";

/**
 * The patient's chosen device on Compare, held outside React.
 *
 * Compare and Checkout are separate screens rendered inside
 * `<motion.div key={current}>` (patient-app-2.tsx), so the whole component
 * tree unmounts and remounts on every navigation. A
 * choice held in `useState` on Compare would be gone by the time Checkout
 * mounts — which is exactly how the comparison became theatre: the CTA and
 * Checkout both fell back to a hardcoded `devices[0]` because there was
 * nowhere else to read the patient's pick from. Same pattern as lib/latch
 * and components/a11y/text-size.tsx, but multi-valued (a device, not a
 * boolean) so it is its own tiny store rather than a `Latch`.
 *
 * Defaults to `devices[0]` so the selection is never undefined — Compare
 * still renders a coherent CTA and Checkout a coherent order before the
 * patient has touched anything.
 */
let selectedName = devices[0].name;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

const getName = () => selectedName;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** The selected device object, never undefined. */
export function selectedDevice() {
  return devices.find(d => d.name === selectedName) ?? devices[0];
}

/** Set the patient's choice by device name. */
export function selectDevice(name: string) {
  selectedName = name;
  emit();
}

/** Reset to the default device, for the start of a fresh walkthrough. */
export function resetSelection() {
  selectedName = devices[0].name;
  emit();
}

/** Read the selected device from a component, re-rendering it on change. */
export function useSelectedDevice() {
  // The server render and the client's first paint must agree, and a fresh
  // page always starts on the default device.
  const name = useSyncExternalStore(subscribe, getName, () => devices[0].name);
  return devices.find(d => d.name === name) ?? devices[0];
}
