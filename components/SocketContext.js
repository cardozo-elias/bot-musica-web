"use client";
import React, { createContext, useContext, useState } from 'react';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const [socketStats, setSocketStats] = useState(null);

    return (
        <SocketContext.Provider value={{ socketStats, setSocketStats }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketStats() {
    return useContext(SocketContext);
}