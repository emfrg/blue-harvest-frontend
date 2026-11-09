import Link from "next/link"

/** Provide a route back to application entry for an unknown page or invalid ID. */
export default function NotFound() {
  return (
    <section className="card empty">
      <h1>Page not found</h1>
      <p>Open an application to view its requests.</p>
      <Link className="button primary" href="/applications">
        Open an application
      </Link>
    </section>
  )
}
