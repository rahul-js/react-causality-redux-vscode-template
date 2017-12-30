import causalityRedux from 'causality-redux'
import { defaultState, controllerFunctions } from './controller'
import { CommentList, CommentForm, CommentBoxDeleteForm, CommentBoxChangeForm, CommentBox } from './view'

// Comment partition entry
const commentBoxPartition = 'commentBoxPartition'

const controllerUIConnections = [
  [
    CommentList, // React Component to wrap with redux connect
    commentBoxPartition,
    [], // Function keys that you want passed into the props of the react component.
    ['items'], // Partition keys that you want passed into the props of the react component.
    'CommentList' // Name of the react component string form
  ],
  [
    CommentForm, // Wrapped component
    commentBoxPartition,
    ['onAuthorChange', 'onTextChange', 'onAddComment'],
    ['author', 'text'],
    'CommentForm'
  ],
  [
    CommentBoxDeleteForm, // Wrapped component
    commentBoxPartition,
    ['onDeleteComment', 'onIdChange'],
    ['idToDelete'],
    'CommentBoxDeleteForm'
  ],
  [
    CommentBoxChangeForm, // Wrapped component
    commentBoxPartition,
    ['onChangeComment', 'onIdChangeForChange', 'onAuthorChangeForChange'],
    ['idToChange', 'authorToChange'],
    'CommentBoxChangeForm'
  ],
  [
    CommentBox, // Wrapped component
    commentBoxPartition,
    [],
    ['CommentList', 'CommentForm', 'CommentBoxDeleteForm', 'CommentBoxChangeForm'],
    'CommentBox'
  ]
]

const { partitionState, setState, wrappedComponents } = causalityRedux.establishControllerConnections({
  module,
  partition: { partitionName: commentBoxPartition, defaultState, controllerFunctions },
  controllerUIConnections
})

export { commentBoxPartition, partitionState, setState }
export default wrappedComponents.CommentBox

// Put in some initial comments.
if (causalityRedux.store[commentBoxPartition].getState().items.length === 0) {
  const initialComments = [
    {author: 'Cory Brown', text: 'My 2 scents'},
    {author: 'Jared Anderson', text: 'Let me put it this way. You`ve heard of Socrates? Aristotle? Plato? Morons!'},
    {author: 'Matt Poulson', text: 'It`s just a function!'},
    {author: 'Bruce Campbell', text: 'Fish in a tree? How can that be?'}
  ]

  initialComments.forEach(comment => causalityRedux.store[commentBoxPartition].onAddComment(comment))
}
