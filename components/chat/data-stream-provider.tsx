"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FoldSource } from "@/lib/ai/gateway-readings";
import type {
  CustomUIDataTypes,
  GatewaySuggestion,
  WaitingStatusData,
} from "@/lib/types";

type SourceCheck = {
  checked: boolean;
  note: string;
};

type DataStreamContextValue = {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
  waitingStatus: WaitingStatusData | undefined;
  setWaitingStatus: React.Dispatch<
    React.SetStateAction<WaitingStatusData | undefined>
  >;
  gatewaySuggestions: GatewaySuggestion[];
  setGatewaySuggestions: React.Dispatch<
    React.SetStateAction<GatewaySuggestion[]>
  >;
  suggesting: boolean;
  setSuggesting: React.Dispatch<React.SetStateAction<boolean>>;
  sourceChecks: Record<string, SourceCheck>;
  toggleSource: (id: string) => void;
  setSourceNote: (id: string, note: string) => void;
  clearSourceChecks: () => void;
  sourcePicksRef: React.MutableRefObject<FoldSource[]>;
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    []
  );
  const [waitingStatus, setWaitingStatus] = useState<WaitingStatusData>();
  const [gatewaySuggestions, setGatewaySuggestions] = useState<
    GatewaySuggestion[]
  >([]);
  const [suggesting, setSuggesting] = useState(false);
  const [sourceChecks, setSourceChecks] = useState<Record<string, SourceCheck>>(
    {}
  );
  const sourcePicksRef = useRef<FoldSource[]>([]);

  useEffect(() => {
    sourcePicksRef.current = Object.entries(sourceChecks)
      .filter(([, row]) => row.checked)
      .map(([id, row]) => ({
        id,
        ...(row.note.trim() ? { note: row.note.trim() } : {}),
      }));
  }, [sourceChecks]);

  const writePicks = useCallback((checks: Record<string, SourceCheck>) => {
    sourcePicksRef.current = Object.entries(checks)
      .filter(([, row]) => row.checked)
      .map(([id, row]) => ({
        id,
        ...(row.note.trim() ? { note: row.note.trim() } : {}),
      }));
  }, []);

  const toggleSource = useCallback(
    (id: string) => {
      setSourceChecks((current) => {
        const row = current[id];
        const next = {
          ...current,
          [id]: { checked: !row?.checked, note: row?.note ?? "" },
        };
        writePicks(next);
        return next;
      });
    },
    [writePicks]
  );

  const setSourceNote = useCallback(
    (id: string, note: string) => {
      setSourceChecks((current) => {
        const next = {
          ...current,
          [id]: { checked: true, note: note.slice(0, 400) },
        };
        writePicks(next);
        return next;
      });
    },
    [writePicks]
  );

  const clearSourceChecks = useCallback(() => {
    writePicks({});
    setSourceChecks({});
  }, [writePicks]);

  const value = useMemo(
    () => ({
      clearSourceChecks,
      dataStream,
      gatewaySuggestions,
      setDataStream,
      setGatewaySuggestions,
      setSourceNote,
      setSuggesting,
      setWaitingStatus,
      sourceChecks,
      sourcePicksRef,
      suggesting,
      toggleSource,
      waitingStatus,
    }),
    [
      clearSourceChecks,
      dataStream,
      gatewaySuggestions,
      setSourceNote,
      sourceChecks,
      suggesting,
      toggleSource,
      waitingStatus,
    ]
  );

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within a DataStreamProvider");
  }
  return context;
}
