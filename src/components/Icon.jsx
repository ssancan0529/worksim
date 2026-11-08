import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Bot,
  Brain,
  Briefcase,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Copy,
  Download,
  Edit3,
  FileText,
  Filter,
  FlaskConical,
  History,
  Info,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  Palette,
  PawPrint,
  Play,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  UserRound,
} from "lucide-react";

const iconMap = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  balance: Scale,
  atom: Atom,
  brain: Brain,
  briefcase: Briefcase,
  bot: Bot,
  check: Check,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "circle-help": CircleHelp,
  "circle-x": CircleX,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  code: Code2,
  copy: Copy,
  download: Download,
  edit: Edit3,
  file: FileText,
  filter: Filter,
  flask: FlaskConical,
  history: History,
  info: Info,
  lightbulb: Lightbulb,
  lock: LockKeyhole,
  messages: MessageCircle,
  paw: PawPrint,
  palette: Palette,
  play: Play,
  reset: RotateCcw,
  search: Search,
  shield: ShieldCheck,
  sparkles: Sparkles,
  terminal: SquareTerminal,
  user: UserRound,
};

export default function Icon({ name, size = 18, className = "" }) {
  const IconComponent = iconMap[name] || CircleHelp;
  return (
    <IconComponent
      className={`icon ${className}`.trim()}
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
      focusable="false"
    />
  );
}
