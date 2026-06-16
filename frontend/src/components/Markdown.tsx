/**
 * Minimal markdown-to-HTML renderer for AI-generated content.
 *
 * Supports headings, bold, italics, bullet/numbered lists, and paragraphs.
 * This intentionally avoids pulling in a full markdown library to keep the
 * bundle small; it covers the subset of markdown the AI prompts produce.
 */
export default function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listBuffer.length === 0) return;
    const ListTag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <ListTag key={`list-${elements.length}`} className={ListTag === "ol" ? "list-decimal pl-6 space-y-1" : "list-disc pl-6 space-y-1"}>
        {listBuffer.map((item, idx) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: inline(item) }} />
        ))}
      </ListTag>
    );
    listBuffer = [];
    listType = null;
  }

  function inline(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code class='rounded bg-secondary px-1 py-0.5 text-xs'>$1</code>");
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    const olMatch = line.match(/^\d+\.\s+(.*)$/);

    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const Tag = (`h${Math.min(level + 1, 6)}` as unknown) as keyof JSX.IntrinsicElements;
      const sizeClass = level === 1 ? "text-xl font-bold mt-4 mb-2" : level === 2 ? "text-lg font-bold mt-3 mb-2" : "text-base font-semibold mt-2 mb-1";
      elements.push(
        <Tag key={idx} className={sizeClass} dangerouslySetInnerHTML={{ __html: inline(headingMatch[2]) }} />
      );
      return;
    }

    if (ulMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(ulMatch[1]);
      return;
    }

    if (olMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(olMatch[1]);
      return;
    }

    flushList();

    if (line.trim() === "") {
      return;
    }

    elements.push(
      <p key={idx} className="my-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />
    );
  });

  flushList();

  return <div className="text-sm">{elements}</div>;
}
