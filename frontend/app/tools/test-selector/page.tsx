import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import TestSelector from "@/components/TestSelector";

export const metadata: Metadata = {
  title: "ابزار انتخاب آزمون آماری",
  description: "با چند سؤال کوتاه، آزمون آماری مناسب داده‌ی خود را پیدا کنید.",
};

export default function ToolPage() {
  return (
    <>
      <PageHeader title="کدام آزمون آماری؟" lead="به چند سؤال کوتاه جواب بدهید تا آزمون مناسب و پیش‌فرض‌های آن را ببینید." crumbs={[{ label: "ابزار انتخاب آزمون" }]} />
      <TestSelector />
    </>
  );
}
