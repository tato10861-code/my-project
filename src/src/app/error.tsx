import React from 'react'

export default function Error({ error }: { error: Error }) {
  // handles rendering unexpected server errors
  console.error('Unhandled error in app', error)
  return <div className="p-8">An unexpected error occurred.</div>
}
