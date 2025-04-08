


import React from 'react'
import { BarList } from "@tremor/react";



const data = [
    { name: "/home", value: 843 },
    { name: "/imprint", value: 46 },
    { name: "/cancellation", value: 3 },
    { name: "/blocks", value: 108 },
    { name: "/documentation", value: 384 },
]


export default function Test() {

    return(
        <>

            <BarList
                data={data}
                
            />
        </>
    )
}
