import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'
import Select from "react-select"

const AuthorEdit = ({ setError, options }) => {
  const [name, setName] = useState('')
  let [born, setBorn] = useState('')

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      setError(error.graphQLErrors[0].message)
      console.log(error)
    }
  })

  const submit = async (event) => {
    event.preventDefault()
    console.log('change birthday...')
    born = Number(born)
    editAuthor({
      variables: { name, born }
    })

    setName('')
    setBorn('')
  }

  const styleObj = {
    width: 400
  }

  return (
    <div style={styleObj}>
      <form onSubmit={submit}>
        <div>
          author name
          <Select
            placeholder="Select author..."
            options={options}
            onChange={({ label }) => setName(label)}
            value={name ? { label: name, value: name.toLowerCase() } : null}
          />
        </div>
        <div>
          set born to
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>change author birthday</button>
      </form>
    </div>
  )
}

export default AuthorEdit
