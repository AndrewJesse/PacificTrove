"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type {
  CustomUIDataTypes,
  GatewaySuggestion,
  WaitingStatusData,
} from "@/lib/types";

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

  const value = useMemo(
    () => ({
      dataStream,
      gatewaySuggestions,
      setDataStream,
      setGatewaySuggestions,
      setSuggesting,
      setWaitingStatus,
      suggesting,
      waitingStatus,
    }),
    [dataStream, gatewaySuggestions, suggesting, waitingStatus]
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
