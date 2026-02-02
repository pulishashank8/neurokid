import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText } from 'lucide-react';
import { useState } from 'react';

interface DocumentChecklistProps {
  documents: string[];
  stepId: number;
}

export function DocumentChecklist({ documents, stepId }: DocumentChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`neurokid_docs_${stepId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleDocument = (doc: string) => {
    const updated = { ...checked, [doc]: !checked[doc] };
    setChecked(updated);
    localStorage.setItem(`neurokid_docs_${stepId}`, JSON.stringify(updated));
  };

  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Documents to Collect
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {completedCount}/{documents.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {documents.map((doc, index) => (
            <li key={index} className="flex items-start gap-3">
              <Checkbox
                id={`doc-${stepId}-${index}`}
                checked={checked[doc] || false}
                onCheckedChange={() => toggleDocument(doc)}
                className="mt-0.5"
              />
              <label
                htmlFor={`doc-${stepId}-${index}`}
                className={`text-sm cursor-pointer ${checked[doc] ? 'line-through text-muted-foreground' : ''}`}
              >
                {doc}
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
