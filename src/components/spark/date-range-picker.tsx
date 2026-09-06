"use client";

import { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Spark `.btn-date-picker` with a flatpickr range attached. Purely a display
 * filter affordance for now — reports the selected range through `onChange`.
 */
export function DateRangePicker({
  defaultRange,
  onChange,
}: {
  defaultRange?: [Date, Date];
  onChange?: (range: [Date, Date] | null) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [label, setLabel] = useState(
    defaultRange ? `${fmt(defaultRange[0])} - ${fmt(defaultRange[1])}` : "All time"
  );

  useEffect(() => {
    if (!btnRef.current) return;
    const fp = flatpickr(btnRef.current, {
      mode: "range",
      dateFormat: "Y-m-d",
      defaultDate: defaultRange,
      onValueUpdate: (dates) => {
        if (dates.length === 2) {
          setLabel(`${fmt(dates[0])} - ${fmt(dates[1])}`);
          onChange?.([dates[0], dates[1]]);
        } else if (dates.length === 1) {
          setLabel(fmt(dates[0]));
        } else {
          setLabel("All time");
          onChange?.(null);
        }
      },
    });
    return () => fp.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button className="btn-date-picker" type="button" ref={btnRef}>
      <i className="bi bi-calendar4-event" />
      <span>{label}</span>
      <i className="bi bi-chevron-down ms-1" />
    </button>
  );
}
