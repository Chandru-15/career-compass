import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sun,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  Target,
} from "lucide-react";

export function RealWorldPreview({
  role,
  typicalDay,
  challenges,
  first90Days,
}) {
  const defaultTypicalDay = `As a ${role || "professional"} in Singapore, your day typically starts with a team standup meeting to align on priorities. You'll spend most of your morning on focused work—whether that's coding, analysis, or client deliverables. Afternoons often include collaborative sessions, code reviews, or stakeholder meetings. The day wraps up with documentation and planning for the next day.`;

  const defaultChallenges = `Common challenges include adapting to fast-paced project cycles, managing multiple stakeholders across time zones, and keeping up with rapidly evolving technologies. You may also face pressure to deliver under tight deadlines while maintaining high quality standards typical of Singapore's competitive market.`;

  const defaultFirst90Days = `Your first 30 days focus on onboarding—understanding company culture, meeting your team, and setting up your development environment. Days 31-60 involve taking on smaller tasks independently while receiving mentorship. By day 90, you'll be expected to contribute meaningfully to projects, participate in sprint planning, and potentially lead small initiatives.`;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-500" />
          Real-World Job Preview
        </CardTitle>
        <p className="text-sm text-slate-500">
          Illustrative guidance for a {role || "professional"}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="typical-day" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
            <TabsTrigger
              value="typical-day"
              className="data-[state=active]:bg-white"
            >
              <Sun className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Typical Day</span>
              <span className="sm:hidden">Day</span>
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="data-[state=active]:bg-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Challenges</span>
              <span className="sm:hidden">Issues</span>
            </TabsTrigger>
            <TabsTrigger
              value="first-90"
              className="data-[state=active]:bg-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">First 90 Days</span>
              <span className="sm:hidden">90 Days</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="typical-day" className="mt-4">
            <div className="p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {typicalDay || defaultTypicalDay}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="mt-4">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {challenges || defaultChallenges}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="first-90" className="mt-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {first90Days || defaultFirst90Days}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
