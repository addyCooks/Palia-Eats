// Puts structured data on a page for search engines. The "<" characters are escaped so that text
// inside the data (a restaurant name, say) can never close the tag early.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
