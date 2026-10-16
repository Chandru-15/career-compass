import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";

const techStacks = [
  "JavaScript",
  "Python",
  "Java",
  "React",
  "Node.js",
  "SQL",
  "AWS",
  "Docker",
  "TypeScript",
  "Go",
];

const roleTypes = ["Full-time", "Part-time", "Contract", "Intern"];
const workArrangements = ["Remote", "Hybrid", "On-site"];

export function JobFilters({
  filters,
  onFilterChange,
  onClear,
  industries = [],
}) {
  const handleTechToggle = (tech) => {
    const current = filters.techStack || [];
    const updated = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];
    onFilterChange({ ...filters, techStack: updated });
  };

  return (
    <Card className="bg-white sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-teal-500" />
            Filters
          </CardTitle>
          {Object.keys(filters).some(
            (key) =>
              filters[key] &&
              (Array.isArray(filters[key]) ? filters[key].length > 0 : true),
          ) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-slate-500"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Job title, company, keywords..."
              className="pl-10"
              value={filters.keyword || ""}
              onChange={(e) =>
                onFilterChange({ ...filters, keyword: e.target.value })
              }
            />
          </div>
        </div>

        {/* Fit Score Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Minimum Fit Score</Label>
            <span className="text-sm font-semibold text-teal-600">
              {filters.minFitScore || 0}%
            </span>
          </div>
          <Slider
            value={[filters.minFitScore || 0]}
            onValueChange={([value]) =>
              onFilterChange({ ...filters, minFitScore: value })
            }
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Only Suitable Toggle */}
        <div className="flex items-center justify-between py-2">
          <Label className="text-sm font-medium">Only show suitable jobs</Label>
          <Switch
            checked={filters.onlySuitable || false}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, onlySuitable: checked })
            }
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Location</Label>
          <Select
            value={filters.location || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                location: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              <SelectItem value="central">Central</SelectItem>
              <SelectItem value="east">East</SelectItem>
              <SelectItem value="north-east">North-East</SelectItem>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Role Type</Label>
          <Select
            value={filters.roleType || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                roleType: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {roleTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Work Arrangement */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Work Arrangement</Label>
          <Select
            value={filters.workArrangement || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                workArrangement: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All arrangements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All arrangements</SelectItem>
              {workArrangements.map((arr) => (
                <SelectItem key={arr} value={arr.toLowerCase()}>
                  {arr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Industry</Label>
          <Select
            value={filters.industry || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                industry: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind.toLowerCase()}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tech Stack</Label>
          <div className="flex flex-wrap gap-2">
            {techStacks.map((tech) => (
              <Badge
                key={tech}
                variant={
                  (filters.techStack || []).includes(tech)
                    ? "default"
                    : "outline"
                }
                className={`cursor-pointer transition-all ${
                  (filters.techStack || []).includes(tech)
                    ? "bg-teal-500 hover:bg-teal-600 border-teal-500"
                    : "hover:bg-slate-100"
                }`}
                onClick={() => handleTechToggle(tech)}
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
