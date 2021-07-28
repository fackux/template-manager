import React from "react"

const CopyButton = (props) => {
  return (
    <button onClick={()=>props.handleClick()}>Copiar HTML</button>
  )
}

export default CopyButton
