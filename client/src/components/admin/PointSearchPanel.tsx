import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";

interface PointSearchFilters {
  searchField: "name" | "username" | "description";
  searchValue: string;
  type: string;
  dateFrom: string;
  dateTo: string;
}

interface PointSearchPanelProps {
  onSearch: (filters: PointSearchFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const SEARCH_FIELD_OPTIONS = [
  { value: "name", label: "이름" },
  { value: "username", label: "아이디" },
  { value: "description", label: "내용" },
];

const TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "deposit_approved", label: "충전" },
  { value: "withdrawal_approved", label: "출금" },
  { value: "admin_add", label: "관리자 지급" },
  { value: "admin_subtract", label: "관리자 차감" },
  { value: "manual_adjustment", label: "관리자(기존)" },
  { value: "use", label: "주문" },
  { value: "order_payment", label: "주문(기존)" },
];

const getDatePreset = (preset: string): { from: string; to: string } => {
  const today = new Date();
  const toDate = today.toISOString().split("T")[0];
  
  switch (preset) {
    case "today": {
      return { from: toDate, to: toDate };
    }
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yd = yesterday.toISOString().split("T")[0];
      return { from: yd, to: yd };
    }
    case "thisWeek": {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      return { from: startOfWeek.toISOString().split("T")[0], to: toDate };
    }
    case "thisMonth": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: startOfMonth.toISOString().split("T")[0], to: toDate };
    }
    case "lastWeek": {
      const dayOfWeek = today.getDay();
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return { from: startOfLastWeek.toISOString().split("T")[0], to: endOfLastWeek.toISOString().split("T")[0] };
    }
    case "lastMonth": {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: startOfLastMonth.toISOString().split("T")[0], to: endOfLastMonth.toISOString().split("T")[0] };
    }
    case "all":
    default:
      return { from: "", to: "" };
  }
};

export function PointSearchPanel({ onSearch, onReset, isLoading }: PointSearchPanelProps) {
  const [filters, setFilters] = useState<PointSearchFilters>({
    searchField: "name",
    searchValue: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      searchField: "name",
      searchValue: "",
      type: "",
      dateFrom: "",
      dateTo: "",
    });
    onReset();
  };

  const handleDatePreset = (preset: string) => {
    const { from, to } = getDatePreset(preset);
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg mb-6">
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700 w-28">검색어</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <select
                  className="h-9 border border-gray-300 rounded px-2 bg-white text-sm min-w-[100px]"
                  value={filters.searchField}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchField: e.target.value as any }))}
                >
                  {SEARCH_FIELD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input
                  placeholder="검색어를 입력하세요"
                  value={filters.searchValue}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchValue: e.target.value }))}
                  className="h-9 max-w-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </td>
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700 w-28">거래유형</td>
            <td className="px-4 py-3">
              <select
                className="h-9 border border-gray-300 rounded px-2 bg-white text-sm min-w-[120px]"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700">기간</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="h-9 w-36"
                />
                <span className="text-gray-400">~</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="h-9 w-36"
                />
              </div>
            </td>
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700">날짜검색</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleDatePreset("today")}
                >
                  오늘
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleDatePreset("yesterday")}
                >
                  어제
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => handleDatePreset("thisWeek")}
                >
                  이번주
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => handleDatePreset("thisMonth")}
                >
                  이번달
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-gray-600 text-white hover:bg-gray-700"
                  onClick={() => handleDatePreset("all")}
                >
                  전체
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-center gap-2 py-4 border-t border-gray-200">
        <Button
          onClick={handleSearch}
          className="h-10 px-8 bg-gray-800 hover:bg-gray-900 text-white"
          disabled={isLoading}
        >
          <Search className="w-4 h-4 mr-2" />
          검색
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="h-10 px-8"
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          초기화
        </Button>
      </div>
    </div>
  );
}
