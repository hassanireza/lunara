export type Example = { id: string; title: string; blurb: string; code: string; actions?: string };

export const STARTER = `// Welcome to the terminal.
// Write a component called App and press Run.
function App() {
  const name = "world";
  return <h1>Hello, {name}!</h1>;
}
`;

export const EXAMPLES: Example[] = [
  { id: 'hello', title: 'Hello, JSX', blurb: 'elements and expressions', code: STARTER },
  { id: 'props', title: 'Props and children', blurb: 'reusable components', code: `function Card({ title, children }) {\n  return (\n    <section className="card">\n      <h3>{title}</h3>\n      {children}\n    </section>\n  );\n}\n\nfunction App() {\n  return (\n    <Card title="Orbit">\n      <p>Small parts, one idea.</p>\n    </Card>\n  );\n}\n` },
  { id: 'lists', title: 'Lists and keys', blurb: 'map, filter, conditions', code: `function App() {\n  const phases = ["new", "crescent", "quarter", "full"];\n  return (\n    <ul>\n      {phases.filter((p) => p.length > 3).map((p) => (\n        <li key={p}>{p.toUpperCase()}</li>\n      ))}\n    </ul>\n  );\n}\n` },
  { id: 'counter', title: 'Counter with state', blurb: 'useState and clicks', code: `import { useState } from 'react';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Add</button>\n    </div>\n  );\n}\n`, actions: 'click button\nclick button\nclick button' },
  { id: 'form', title: 'Controlled input', blurb: 'typing and submit', code: `import { useState } from 'react';\n\nfunction App() {\n  const [name, setName] = useState("");\n  const [sent, setSent] = useState("");\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); setSent(name); }}>\n      <input value={name} onChange={(e) => setName(e.target.value)} />\n      <button>Send</button>\n      {sent && <p>Hello, {sent}!</p>}\n    </form>\n  );\n}\n`, actions: 'type input Ada\nsubmit form' },
  { id: 'effect', title: 'Effects and timers', blurb: 'useEffect, wait 1000', code: `import { useEffect, useState } from 'react';\n\nfunction App() {\n  const [seconds, setSeconds] = useState(0);\n  useEffect(() => {\n    console.log("clock started");\n    const id = setInterval(() => setSeconds((s) => s + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <p>Seconds: {seconds}</p>;\n}\n`, actions: 'wait 3000' },
  { id: 'reducer', title: 'Reducer', blurb: 'useReducer actions', code: `import { useReducer } from 'react';\n\nfunction reducer(count, action) {\n  if (action === "inc") return count + 1;\n  if (action === "reset") return 0;\n  return count;\n}\n\nfunction App() {\n  const [count, dispatch] = useReducer(reducer, 0);\n  return (\n    <div>\n      <p>{count}</p>\n      <button onClick={() => dispatch("inc")}>+</button>\n      <button onClick={() => dispatch("reset")}>Reset</button>\n    </div>\n  );\n}\n`, actions: 'click "+"\nclick "+"\nclick "Reset"\nclick "+"' },
  { id: 'context', title: 'Context', blurb: 'share values without props', code: `import { createContext, useContext } from 'react';\n\nconst ThemeContext = createContext("light");\n\nfunction Label() {\n  const theme = useContext(ThemeContext);\n  return <p>Theme: {theme}</p>;\n}\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <Label />\n    </ThemeContext.Provider>\n  );\n}\n` },
  { id: 'hook', title: 'Custom hook', blurb: 'reuse stateful logic', code: `import { useState } from 'react';\n\nfunction useToggle(initial) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn(!on)];\n}\n\nfunction App() {\n  const [on, toggle] = useToggle(false);\n  return <button onClick={toggle}>{on ? "On" : "Off"}</button>;\n}\n`, actions: 'click button' },
  { id: 'blank', title: 'Blank page', blurb: 'start from nothing', code: '' },
];

/** The Actions panel language, shown in the help sheet. */
export const ACTION_HELP: Array<[string, string]> = [
  ['click button', 'click the first button (button[2] is the second)'],
  ['click "Add"', 'click the element whose text is Add'],
  ['type input hello', 'type into an input, replacing its value'],
  ['check input / uncheck input', 'tick or untick a checkbox'],
  ['choose select red', 'pick an option in a select'],
  ['submit form', 'submit a form'],
  ['key input Enter', 'press a key in an element'],
  ['wait 1000', 'move the clock forward 1000 ms (timers fire)'],
];
