const path = require('path')
const fs = require('fs')
const configCommon = require('./webpack.config.config')

function mkdir (directory) {
  try {
    fs.mkdirSync(directory)
  } catch (ex) {
  }
}

const makePartitionName = (component) =>
  `${component.charAt(0).toLowerCase()}${component.slice(1)}Partition`

const modelTestFileCode = (component) => {
  return (
    `import assert from 'assert'

describe('Model ${component}', function () {
  // TODO: Add model test code.
  it('Sample - validated.', function () {
    assert(true)
  })
})
`)
}

const controllerTestFileCode = (component) => {
  return (
    `import assert from 'assert'

/*
import CausalityRedux from 'causality-redux'
import {${makePartitionName(component)}} from './controller'

// The controller functions are in the partition store.
const partitionStore = CausalityRedux.store[${makePartitionName(component)}]
const partitionState = partitionStore.partitionState
*/

describe('Controller ${component}', function () {
  // TODO: Add controller test code.
  it('Sample - validated.', function () {
    assert(true)
  })
})
`)
}

const viewTestCode = (dir, component) => {
  let importPath = ''
  const c = dir.split(path.sep)
  for (let i = 0; i < c.length; ++i) {
    importPath += '../'
  }
  importPath += 'test/projectsetup'
  return (
    `
import assert from 'assert'
// Use what you need below. There are others also.
// import { testCauseAndEffectWithExists, testCauseAndEffectWithNotExists, testCauseAndEffectWithHtmlString, testCauseAndEffectWithTextField } from '${importPath}'

describe('View ${component}', function () {
  // TODO: Add view test code.
  it('Sample - validated.', function () {
    assert(true)
  })
})
`)
}

const handleTestFiles = (dir, component, doTest) => {
  if (!doTest) {
    return
  }
  fs.writeFileSync(path.join(dir, 'controller.spec.js'), controllerTestFileCode(component))
  fs.writeFileSync(path.join(dir, 'view.spec.js'), viewTestCode(dir, component))
  fs.writeFileSync(path.join(dir, 'model.spec.js'), modelTestFileCode(component))
}

const controllerCode = (component, isMultiple) => {
  let code =
        'import CausalityRedux from \'causality-redux\''
  if (isMultiple) {
    code += `
import {${component}} from './view'`
  } else {
    code += `
import ${component} from './view'`
  }
  code +=
        `
/*
  Note: Hot reloading in this controller file only supports changes to the controllerFunctions.
  Any other change requires a refresh.
*/

/*
 TODO: Define the partition store definition
*/
const defaultState = {
  sampleKey1: '',
  sampleKey2: []
}

/*
 TODO: Define Controller functions which will be made available by causality-redux to the react
 UI component in the props. The fundamental role of a controller function is to set values in the redux
 partition defaultState. This may be done based on changes from the UI or may also be done as
 a result of a call to a synchronous or asynchronous operation in the business code (model.js).
 Based on changes in defaultState, causality-redux will re-render the react component with these
 new values set correctly in the props so that the react UI is updated correctly.

 Use partitionState to access the keys of default state in these functions.
 partitionState is a proxy that returns a copy of the value at the selected key.
 Example:
 let value = partitionState.key;

 To set a key do partitionState.key = value;
 use setState to set multiple keys simultaenously like setState({sampleKey1: val1, sampleKey2: val2});
 Using partitionState to set multiple keys will cause multiple renders of the react component(s).
*/
const controllerFunctions = {
  sampleFunction1: (url) => {
    partitionState.sampleKey1 = url
  },
  sampleFunction2: (e) => {
    // Note partitionState returns a copy of the value at the key.
    // So, the below must be done to correctly change objects, which are pointers in javascript.
    const arr = partitionState.sampleKey2
    arr.push(e)
    partitionState.sampleKey2 = arr
  },
  sampleFunction3: (url, arr) => {
    // Each assignment by partitionState causes a component render
    // So use the below to change multiple keys with one render.
    setState({sampleKey1: url, sampleKey2: arr})
  }
}
`

  if (isMultiple) {
    code +=
          `
/*
  TODO: Add your UI props connections here.
  Each child component of ${component} that requires contoller functions or values in the defaultState above
  needs to be listed in the controllerUIConnections below as an array.
  Entry1 - The component. Must be imported from ../view
  Entry2 - Array of controllerFunctions keys that this component needs provided in the props.
  Entry3 - Array of defaultState keys (store keys) that this component needs provided in the props.
  Entry4 - String name of the component.

  CausalityRedux automatically adds any component name(key)/component listed in controllerUIConnections
  to the component's store partition. This way, you can access the redux connected component in the props.

  Any component listed below that is required by another component must be listed in the parent component's
  store keys. Then the parent must include that component's name in the props.
  Example:

const controllerUIConnections = [
  [Child, ['sampleFunction2'], ['sampleKey2'], 'Child'],
  [Parent, ['sampleFunction1'], ['sampleKey1', 'Child'], 'Parent']
]

in view.jsx

const Child = ({sampleFunction2, sampleKey2}) =>
  <div />

// Note that Child is included in Parent in controllerUIConnections in the store keys.
// Then CausalityRedux creates a partition store entry that contains the enhanced redux connected Child component.
// You then use that as a component in the Parent react definition.

// Child below is not the Child defined above but is the redux connected component.
const Parent = ({sampleFunction1, sampleKey1, Child}) =>
  <Child />
*/

export const ${makePartitionName(component)} = '${makePartitionName(component)}'

const controllerUIConnections = [
  [${component}, ${makePartitionName(component)}, ['sampleFunction1'], ['sampleKey1'], '${component}']
]

const { partitionState, setState, wrappedComponents } = CausalityRedux.establishControllerConnections({
  module,
  partition: { partitionName: ${makePartitionName(component)}, defaultState, controllerFunctions },
  controllerUIConnections
})

// Export the redux connected component. Use this in the parent component(s).
export default wrappedComponents.${component}
`
  } else {
    code +=
          `
/*
 This establishes all the connections between the UI and defaultState/controllerFunctions.
 It also supports hot reloading for the business logic, UI component and the controller functions.
 By default, all the function keys in controllerFunctions and state keys in defaultState will be made available
 in the props of the connect redux component uiComponent: ${component}.
 To override the function keys, define an array of function key strings at changerKeys in the input object
 to establishControllerConnections.
 To override the defaultState keys, define an array of defaultState key strings at storeKeys in the input object
 to establishControllerConnections.
 */
export const ${makePartitionName(component)} = '${makePartitionName(component)}'
const { partitionState, setState, wrappedComponents } = CausalityRedux.establishControllerConnections({
  module, // Needed for hot reloading.
  partition: { partitionName: ${makePartitionName(component)}, defaultState, controllerFunctions },
  uiComponent: ${component}, // Redux connect will be called on this component and returned as uiComponent in the returned object.
  uiComponentName: '${component}' // Used for tracing.
})

// Export the redux connect component. Use this in the parent component(s).
export default wrappedComponents.${component}
`
  }
  return code
}

const viewCode = (component, isMultiple) => {
  let code =
        `import React from 'react'

// TODO: Add your defaultState keys and controllerFunctions keys from ./controller.js
// as shown below.
`

  if (!isMultiple) {
    code +=
          `const ${component} = (/* {sampleKey1, sampleKey2, sampleFunction1, sampleFunction2, sampleFunction3} */) =>
  <div>
    TODO: Define your component.
  </div>

export default ${component}
`
  } else {
    code +=
          `export const ${component} = (/* {sampleKey1, sampleKey2, sampleFunction1, sampleFunction2, sampleFunction3} */) =>
  <div>
    TODO: Define your component.
  </div>
`
  }
  return code
}

const modelCode = () =>
  `/*
  Ideally, the business code would consist only of pure functions. However, there are cases (such as a cache)
  where business code data is needed.
  To support hot reloading, use the below for business data.
  This will create a unique redux partition for this business data in order to support hot reloading
  in this business code.

  let nonUIData = {
    whateveryouneed: [];
    numberType: 0;
  }
  const moduleData = CausalityRedux.getModuleData(process.env.NODE_ENV !== 'production', nonUIData).moduleData;

  Then moduleData is a proxy to the redux store partitiondata.
  So, moduleData.whateveryouneed returns a copy to the data. Then to change whateveryouneed do
  let arr = moduleData.whateveryouneed;
  arr.push('1');
  moduleData.whateveryouneed = arr;

  For javascript basic data types, simply do the below.
  moduleData.numberType = 1;
  or you can do
  ++moduleData.numberType;

  TODO: Add your business functions
*/
`

const controllerCodewc = (component, isMultiple) => {
  let code =
        `import CausalityRedux from 'causality-redux'
`
  if (isMultiple) {
    code += `import {${component}} from './view'`
  } else {
    code += `import ${component} from './view'`
  }
  code += `

// TODO: Define the partition store definition
const defaultState = {
  sampleKey1: ''
}

// TODO: Define Controller functions available to the UI.
const controllerFunctions = {
  sampleFunction1: (url) => {
    partitionState.sampleKey1 = url
  }
}

`
  if (isMultiple) {
    code +=
          `export const ${makePartitionName(component)} = '${makePartitionName(component)}'

// TODO: Add your UI props connections here.
const controllerUIConnections = [
  [${component}, ${makePartitionName(component)}, ['sampleFunction1'], ['sampleKey1'], '${component}']
]

const { partitionState, /* setState, */ wrappedComponents } = CausalityRedux.establishControllerConnections({
  module,
  partition: { partitionName: ${makePartitionName(component)}, defaultState, controllerFunctions },
  controllerUIConnections
})

// Export the redux connected component. Use this in the parent component(s).
export default wrappedComponents.${component}
`
  } else {
    code +=
`export const ${makePartitionName(component)} = '${makePartitionName(component)}'

const { partitionState, /* setState, */ wrappedComponents } = CausalityRedux.establishControllerConnections({
  module,
  partition: { partitionName: ${makePartitionName(component)}, defaultState, controllerFunctions },
  uiComponent: ${component},
  uiComponentName: '${component}'
})

export default wrappedComponents.${component}
`
  }
  return code
}

const viewCodewc = (component, isMultiple) => {
  let code = `import React from 'react'

`

  if (isMultiple) {
    code +=
          `export const ${component} = (/* {sampleKey1, sampleFunction1} */) =>
  <div>
    TODO: Define your component.
  </div>
`
  } else {
    code +=
          `const ${component} = (/* {sampleKey1, sampleFunction1} */) =>
  <div>
    TODO: Define your component.
  </div>

export default ${component}
`
  }
  return code
}

const viewCodeReact = (component) => {
  let code = `import React from 'react'

`
  code +=
        `export default class ${component} extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
    return(
      <div>
        TODO: Define your component.
      </div>
    );
  }
}`

  return code
}

const modelCodewc = () =>
  `// TODO: Add your business functions
`

const makeComponentDirectories = (component, noCR, isUI) => {
  let dir = ''

  if (!isUI) {
    dir = path.join(configCommon.sourceDir, configCommon.reactComponentsDirectory)
  }
  const arr = component.split('/')
  let len = arr.length
  if (noCR) {
    --len
  }
  for (let i = 0; i < len; ++i) {
    dir = path.join(dir, arr[i])
    mkdir(dir)
  }
  return { dir, component: arr[arr.length - 1] }
}

const generateReact = (component, doTest, isUI) => {
  const dir = makeComponentDirectories(component, true, isUI).dir
  const filePath = path.join(dir, `${component}.jsx`)

  if (fs.existsSync(filePath)) {
    return false
  }

  fs.writeFileSync(filePath, viewCodeReact(component))
  if (doTest) {
    fs.writeFileSync(path.join(dir, `${component}.spec.js`), viewTestCode(dir, component))
  }
  return true
}

const generateReactMVC = (component, doTest, isMultiple, comments, isUI) => {
  const ret = makeComponentDirectories(component, false, isUI)
  const dir = ret.dir

  if (fs.existsSync(path.join(dir, 'view.jsx'))) {
    return false
  }

  component = ret.component

  let view, controller, model
  if (comments) {
    view = viewCode(component, isMultiple)
    controller = controllerCode(component, isMultiple)
    model = modelCode()
  } else {
    view = viewCodewc(component, isMultiple)
    controller = controllerCodewc(component, isMultiple)
    model = modelCodewc()
  }

  fs.writeFileSync(path.join(dir, 'controller.js'), controller)
  fs.writeFileSync(path.join(dir, 'view.jsx'), view)
  fs.writeFileSync(path.join(dir, 'model.js'), model)
  handleTestFiles(dir, component, doTest)
  return true
}

const generateReactComponent = (defaultDirectory, useCausalityRedux, component, doTest, isMultiple, comments) => {
  const dir = `${defaultDirectory}/${component}`
  let ret
  if (useCausalityRedux) {
    ret = generateReactMVC(dir, doTest, isMultiple, comments, true)
  } else {
    ret = generateReact(dir, doTest, true)
  }
  if (ret) {
    process.exit(0)
  }
  process.exit(1)
}

module.exports = { generateReactMVC, generateReact, generateReactComponent }
