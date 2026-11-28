import type { Block } from "@/lib/content";

export default function GuideBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2": return <h2 key={i}>{b.text}</h2>;
          case "p": return <p key={i}>{b.text}</p>;
          case "note": return <p key={i} className="note-box">{b.text}</p>;
          case "ul": return <ul key={i}>{b.items.map((x) => <li key={x}>{x}</li>)}</ul>;
          case "ol": return <ol key={i}>{b.items.map((x) => <li key={x}>{x}</li>)}</ol>;
          case "table":
            return (
              <div key={i} className="table-scroll">
                <table>
                  <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
