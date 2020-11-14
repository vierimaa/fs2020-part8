import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import Select from "react-select"

import { ALL_BOOKS } from '../queries'

const Books = (props) => {
  const [genre, setGenre] = useState(null)
  const result = useQuery(ALL_BOOKS)
  
  if (!props.show) {
    return null
  }
  
  if (result.loading)  {
    return <div>loading...</div>
  }

  const books = result.data.allBooks
  
  const genresAll = books.map(book => 
    book.genres.map(genre => genre)
  ).flat()

  const options = genresAll.map(g => ({ value: g, label: g}))

  let filteredBooks
  if (genre) {
    filteredBooks = books.filter(b => b.genres.includes(genre))
  }

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th>
              title
            </th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {!genre ?
            books.map(b =>
              <tr key={b.title}>
                <td>{b.title}</td>
                <td>{b.author.name}</td>
                <td>{b.published}</td>
              </tr>
            )
            :
            filteredBooks.map(b =>
              <tr key={b.title}>
                <td>{b.title}</td>
                <td>{b.author.name}</td>
                <td>{b.published}</td>
              </tr>
            )
        }
        </tbody>
      </table>
      <Select
        placeholder="Select genre..."
        options={options}
        onChange={({ label }) => setGenre(label)}
        value={genre ? { label: genre, value: genre.toLowerCase() } : null}
      />
      <button onClick={() => setGenre(null)}>clear filters</button>
    </div>
  )
}

export default Books