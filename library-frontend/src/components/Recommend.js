import React from 'react'
import { useQuery } from '@apollo/client'

import { ALL_BOOKS, ME } from '../queries'

const Recommend = (props) => {
  const resultMe = useQuery(ME)

  const favoriteGenre = resultMe?.data?.me?.favoriteGenre
  
  const result = useQuery(ALL_BOOKS, {
    variables: { filterByGenre: favoriteGenre }
  })
  
  if (!props.show) {
    return null
  }
  
  if (result.loading || resultMe.loading)  {
    return <div>loading...</div>
  }

  if (result.error || resultMe.error) {
    return <p>Error</p>
  }

  const books = result?.data?.allBooks

  console.log('books', books)
  console.log('favoriteGenre', favoriteGenre)
  console.log('resultMe?.data', resultMe?.data)
  
  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre</p>

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
          {result?.data?.allBooks.length === 0 && !result.loading ?
            <tr>
              <td>No recommendations found</td>
            </tr>
            :
            result?.data?.allBooks.map(b =>
              <tr key={b.title}>
                <td>{b.title}</td>
                <td>{b.author.name}</td>
                <td>{b.published}</td>
              </tr>
            )
        }
        </tbody>
      </table>
    </div>
  )
}

export default Recommend