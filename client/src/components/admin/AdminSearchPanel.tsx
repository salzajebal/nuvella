import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Calendar } from "lucide-react";

interface MemberSearchFilters {
  searchField: "name" | "username" | "nickname" | "email" | "phone" | "memo";
  searchValue: string;
  isActive: boolean | null;
  isFrozen: boolean | null;
  dateFrom: string;
  dateTo: string;
}

interface AdminSearchPanelProps {
  onSearch: (filters: MemberSearchFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const SEARCH_FIELD_OPTIONS = [
  { value: "name", label: "이름" },
  { value: "username", label: "아이디" },
  { value: "nickname", label: "닉네임" },
  { value: "email", label: "E-MAIL" },
  { value: "phone", label: "전화번호" },
  { value: "memo", label: "메모" },
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

export function AdminSearchPanel({ onSearch, onReset, isLoading }: AdminSearchPanelProps) {
  const [filters, setFilters] = useState<MemberSearchFilters>({
    searchField: "name",
    searchValue: "",
    isActive: null,
    isFrozen: null,
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
      isActive: null,
      isFrozen: null,
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
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700 w-28">회원상태</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={filters.isActive === null}
                    onChange={() => setFilters(prev => ({ ...prev, isActive: null }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">전체</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={filters.isActive === true}
                    onChange={() => setFilters(prev => ({ ...prev, isActive: true }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">활성</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={filters.isActive === false}
                    onChange={() => setFilters(prev => ({ ...prev, isActive: false }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">비활성</span>
                </label>
              </div>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700">동결상태</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isFrozen"
                    checked={filters.isFrozen === null}
                    onChange={() => setFilters(prev => ({ ...prev, isFrozen: null }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">전체</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isFrozen"
                    checked={filters.isFrozen === true}
                    onChange={() => setFilters(prev => ({ ...prev, isFrozen: true }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">동결</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isFrozen"
                    checked={filters.isFrozen === false}
                    onChange={() => setFilters(prev => ({ ...prev, isFrozen: false }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">정상</span>
                </label>
              </div>
            </td>
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700">가입일</td>
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
          </tr>
          <tr>
            <td className="bg-gray-100 px-4 py-3 font-medium text-gray-700">날짜검색</td>
            <td colSpan={3} className="px-4 py-3">
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
                  className="h-8 px-3 text-xs bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => handleDatePreset("lastWeek")}
                >
                  지난주
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => handleDatePreset("lastMonth")}
                >
                  지난달
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
