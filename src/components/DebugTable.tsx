import type { DebugRow } from "../logic/experiment";

const cell = "border border-gray-300 px-2 py-1 text-center";

export function DebugTable({ rows }: { rows: DebugRow[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={cell}>Iteration</th>
          <th className={cell}>targetValue</th>
          <th className={cell}>Last stepSize</th>
          <th className={cell}>Bounds</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className={cell}>{r.iteration}</td>
            <td className={cell}>{r.targetValue}</td>
            <td className={cell}>{r.stepSize}</td>
            <td className={cell}>{r.bnds}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
