import { Camera, FileText, Gem, History, Plus } from "lucide-react";

type Props = {
  onNewEvaluation: () => void;
};

export default function AntiqueSidebar({ onNewEvaluation }: Props) {
  return (
    <aside className="hidden w-[250px] shrink-0 border-l border-[#3a2618]/10 bg-white/35 px-4 py-5 backdrop-blur-2xl lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2b1b12] text-[#f8ead6] shadow-lg shadow-[#2b1b12]/15">
          <Gem className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#26170f]">Antique Lens</p>
          <p className="text-xs text-[#6d5949]">AI antique evaluator</p>
        </div>
      </div>

      <button
        onClick={onNewEvaluation}
        className="mb-7 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2b1b12] text-sm font-medium text-[#f8ead6] shadow-lg shadow-[#2b1b12]/15 transition hover:-translate-y-0.5 hover:bg-[#3a2518]"
      >
        <Plus className="h-4 w-4" />
        تقييم جديد
      </button>

      <div className="space-y-2">
        <SidebarItem icon={<Camera className="h-4 w-4" />} label="تقييم صورة" active />
        <SidebarItem icon={<FileText className="h-4 w-4" />} label="تقرير أولي" />
        <SidebarItem icon={<History className="h-4 w-4" />} label="السجل لاحقاً" />
      </div>

      <div className="mt-8 rounded-3xl border border-[#3a2618]/10 bg-[#fff8ef]/55 p-4">
        <p className="text-sm font-semibold text-[#2b1b12]">تنبيه مهم</p>
        <p className="mt-2 text-xs leading-6 text-[#6d5949]">
          التقييم استرشادي ولا يُعد شهادة أصالة أو سعراً نهائياً.
        </p>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${
        active
          ? "bg-[#2b1b12] text-[#f8ead6]"
          : "text-[#6d5949] hover:bg-white/45"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}