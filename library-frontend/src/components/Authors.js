import React from 'react'
import AuthorEdit from './AuthorEdit'
import { useQuery } from '@apollo/client'

import { ALL_AUTHORS } from '../queries'

const Authors = ({ show, setError, token }) => {
  const result = useQuery(ALL_AUTHORS)
  
  if (!show) {
    return null
  }

  if (result.loading)  {
    return <div>loading...</div>
  }

  const authors = result.data.allAuthors
  const options = authors.map(a => ({ value: a.name, label: a.name }))
  console.log('options', options)
  
  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>
      {token ? <AuthorEdit setError={setError} options={options}/> : null}
    </div>
  )
}

export default Authors
