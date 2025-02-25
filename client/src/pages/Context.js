import React, { createContext, useContext, useState } from "react";

const MyContext = createContext();

export const MyProvider = ({ children }) => {
    const [entireObject, setEntireObject] = useState({});

    return (
        <>
            <MyContext.Provider value={{ entireObject,setEntireObject }}>
                {children}
            </MyContext.Provider>
        </>
    )
}

export const useMyContext = () => useContext(MyContext);