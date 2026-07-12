"use client";

import { useMemo } from "react";
import { groupDeviceModelsByManufacturer } from "@/lib/deviceModels";

const CUSTOM_VALUE = "__custom__";

export default function DeviceModelSelect({
  value,
  onChange,
  deviceModels = [],
  onModelSelected,
}) {
  const groupedModels = useMemo(() => groupDeviceModelsByManufacturer(deviceModels), [deviceModels]);
  const matchedModel = deviceModels.find((entry) => entry.name === value);
  const selectValue = matchedModel?.id ?? (value ? CUSTOM_VALUE : "");

  function handleSelectChange(event) {
    const nextValue = event.target.value;
    if (nextValue === CUSTOM_VALUE) {
      onChange(value);
      return;
    }

    if (!nextValue) {
      onChange("");
      return;
    }

    const model = deviceModels.find((entry) => entry.id === nextValue);
    if (!model) {
      return;
    }

    onChange(model.name);
    onModelSelected?.(model);
  }

  return (
    <div className="device-model-select">
      <select value={selectValue} onChange={handleSelectChange}>
        <option value="">Select model…</option>
        {groupedModels.map(([manufacturer, models]) => (
          <optgroup key={manufacturer} label={manufacturer}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM_VALUE}>Custom model…</option>
      </select>

      {selectValue === CUSTOM_VALUE || (value && !matchedModel) ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter model name"
        />
      ) : null}
    </div>
  );
}
