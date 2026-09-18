import {
  loadAnalytics,
  saveAnalytics,
  clearAnalytics,
} from "./game/analytics/analyticsStorage";
import { recordCompletedGame } from "./game/analytics/recordCompletedGame";

const [analytics, setAnalytics] = useState(loadAnalytics);
