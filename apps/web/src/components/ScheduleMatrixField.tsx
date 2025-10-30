"use client";

import { Button, useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";
import "./ScheduleMatrixField.scss";

interface DateColumn {
    id: string;
    selectedDate: string;
}

interface ScheduleEntry {
    columnIndex: number;
    status: string;
}

interface ScheduleData {
    [instrument: string]: ScheduleEntry[];
}

interface ScheduleMatrixData {
    dateCols?: DateColumn[];
    scheduleTable?: ScheduleData;
}

const instruments = [
    { key: "wti", label: "WTI" },
    { key: "xauusd", label: "XAUUSD (Gold)" },
    { key: "xagusd", label: "XAGUSD (Silver)" },
    { key: "eurusd", label: "EURUSD" },
    { key: "gbpusd", label: "GBPUSD" },
    { key: "usdjpy", label: "USDJPY" },
    { key: "us30", label: "US30 (Dow Jones)" },
    { key: "nas100", label: "NAS100 (Nasdaq)" },
    { key: "spx500", label: "SPX500 (S&P 500)" },
    { key: "btcusd", label: "BTCUSD (Bitcoin)" },
];

export default function ScheduleMatrixField({
    path,
}: {
    path: string;
    name?: string;
}) {
    const { value, setValue } = useField<ScheduleMatrixData>({ path });

    const [dateCols, setDateCols] = useState<DateColumn[]>(
        value?.dateCols || [],
    );
    const [scheduleData, setScheduleData] = useState<ScheduleData>(
        value?.scheduleTable || {},
    );

    useEffect(() => {
        setValue({
            dateCols,
            scheduleTable: scheduleData,
        });
    }, [dateCols, scheduleData, setValue]);

    const addDateColumn = () => {
        const newId = Date.now().toString();
        const newDate: DateColumn = {
            id: newId,
            selectedDate: new Date().toISOString().split("T")[0],
        };
        setDateCols([...dateCols, newDate]);
    };

    const updateDateColumn = (index: number, selectedDate: string) => {
        const newDateCols = [...dateCols];
        newDateCols[index] = { ...newDateCols[index], selectedDate };
        setDateCols(newDateCols);
    };

    const removeDateColumn = (index: number) => {
        const newDateCols = dateCols.filter((_, i) => i !== index);
        setDateCols(newDateCols);

        // Remove corresponding schedule data for this column
        const newScheduleData = { ...scheduleData };
        instruments.forEach((instrument) => {
            if (newScheduleData[instrument.key]) {
                newScheduleData[instrument.key] = newScheduleData[
                    instrument.key
                ].filter((entry) => entry.columnIndex !== index + 1);
            }
        });
        setScheduleData(newScheduleData);
    };

    const updateScheduleEntry = (
        instrumentKey: string,
        columnIndex: number,
        status: string,
    ) => {
        const newScheduleData = { ...scheduleData };

        if (!newScheduleData[instrumentKey]) {
            newScheduleData[instrumentKey] = [];
        }

        const existingEntryIndex = newScheduleData[instrumentKey].findIndex(
            (entry) => entry.columnIndex === columnIndex,
        );

        if (existingEntryIndex >= 0) {
            if (status.trim() === "") {
                // Remove entry if status is empty
                newScheduleData[instrumentKey] = newScheduleData[
                    instrumentKey
                ].filter((entry) => entry.columnIndex !== columnIndex);
            } else {
                // Update existing entry
                newScheduleData[instrumentKey][existingEntryIndex] = {
                    columnIndex,
                    status: status.trim(),
                };
            }
        } else if (status.trim() !== "") {
            // Add new entry
            newScheduleData[instrumentKey].push({
                columnIndex,
                status: status.trim(),
            });
        }

        setScheduleData(newScheduleData);
    };

    const getScheduleValue = (
        instrumentKey: string,
        columnIndex: number,
    ): string => {
        if (!scheduleData[instrumentKey]) return "";
        const entry = scheduleData[instrumentKey].find(
            (entry) => entry.columnIndex === columnIndex,
        );
        return entry?.status || "";
    };

    const formatDate = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="schedule-matrix-field">
            <div className="schedule-matrix-field__header">
                <h3 className="schedule-matrix-field__title">
                    Trading Schedule Matrix
                </h3>
                <p className="schedule-matrix-field__description">
                    Configure trading hours and status for different instruments
                    across multiple dates
                </p>
            </div>

            {/* Date Columns Management */}
            <div className="schedule-matrix-field__section">
                <div className="schedule-matrix-field__section-header">
                    <div>
                        <h4 className="schedule-matrix-field__section-title">
                            Date Columns
                        </h4>
                        <p className="schedule-matrix-field__section-description">
                            Add dates that will appear as columns in your
                            schedule table
                        </p>
                    </div>
                    <Button
                        buttonStyle="primary"
                        size="small"
                        onClick={addDateColumn}
                        type="button"
                    >
                        Add Date Column
                    </Button>
                </div>

                {dateCols.length > 0 ? (
                    <div className="schedule-matrix-field__date-columns">
                        {dateCols.map((dateCol, index) => (
                            <div
                                key={dateCol.id}
                                className="schedule-matrix-field__date-column"
                            >
                                <div className="schedule-matrix-field__column-badge">
                                    Col {index + 1}
                                </div>
                                <input
                                    type="date"
                                    value={dateCol.selectedDate}
                                    onChange={(e) => {
                                        updateDateColumn(index, e.target.value);
                                    }}
                                    className="input schedule-matrix-field__date-input"
                                />
                                <Button
                                    buttonStyle="transparent"
                                    icon="x"
                                    iconStyle="without-border"
                                    tooltip="Remove column"
                                    onClick={() => removeDateColumn(index)}
                                    aria-label="Remove date column"
                                    type="button"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="schedule-matrix-field__empty-state">
                        <p>No date columns added yet</p>
                        <p className="schedule-matrix-field__empty-state-hint">
                            Click "Add Date Column" to get started
                        </p>
                    </div>
                )}
            </div>

            {/* Schedule Matrix */}
            {dateCols.length > 0 && (
                <div className="schedule-matrix-field__section">
                    <div className="schedule-matrix-field__section-header">
                        <div>
                            <h4 className="schedule-matrix-field__section-title">
                                Schedule Matrix
                            </h4>
                            <p className="schedule-matrix-field__section-description">
                                Enter trading status for each instrument on the
                                selected dates
                            </p>
                        </div>
                    </div>

                    <div className="schedule-matrix-field__table-container">
                        <table className="schedule-matrix-field__table">
                            <thead>
                                <tr>
                                    <th className="schedule-matrix-field__table-header">
                                        Instrument
                                    </th>
                                    {dateCols.map((dateCol, index) => (
                                        <th
                                            key={dateCol.id}
                                            className="schedule-matrix-field__table-header schedule-matrix-field__table-header--center"
                                        >
                                            <div className="schedule-matrix-field__column-header">
                                                <span className="schedule-matrix-field__column-number">
                                                    Column {index + 1}
                                                </span>
                                                <span className="schedule-matrix-field__column-date">
                                                    {formatDate(
                                                        dateCol.selectedDate,
                                                    )}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {instruments.map((instrument, rowIndex) => (
                                    <tr
                                        key={instrument.key}
                                        className={`schedule-matrix-field__table-row ${
                                            rowIndex % 2 === 0
                                                ? "schedule-matrix-field__table-row--even"
                                                : ""
                                        }`}
                                    >
                                        <td className="schedule-matrix-field__table-cell schedule-matrix-field__table-cell--instrument">
                                            {instrument.label}
                                        </td>
                                        {dateCols.map(
                                            (dateCol, columnIndex) => (
                                                <td
                                                    key={dateCol.id}
                                                    className="schedule-matrix-field__table-cell"
                                                >
                                                    <input
                                                        type="text"
                                                        value={getScheduleValue(
                                                            instrument.key,
                                                            columnIndex + 1,
                                                        )}
                                                        onChange={(e) =>
                                                            updateScheduleEntry(
                                                                instrument.key,
                                                                columnIndex + 1,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Enter status..."
                                                        className="input schedule-matrix-field__input"
                                                    />
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="schedule-matrix-field__legend">
                        <span className="schedule-matrix-field__legend-item">
                            Common values: "Normal Hours", "Closed", "Early
                            Close @ 19:00", "Late Open @ 03:00"
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
