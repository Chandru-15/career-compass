import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Bot, FileText, Target, ArrowRight } from 'lucide-react';

const actions = [
  {
    title: 'Find Jobs',
    description: 'Search matching opportunities',
    icon: Search,
    page: 'JobSearch',
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
  },
  {
    title: 'AI Planner',
    description: 'Get personalized advice',
    icon: Bot,
    page: 'AIPlanner',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Applications',
    description: 'Track your progress',
    icon: FileText,
    page: 'Applications',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'Skills Roadmap',
    description: 'Plan your learning path',
    icon: Target,
    page: 'SkillsRoadmap',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.title} to={createPageUrl(action.page)}>
            <Card className="group hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer overflow-hidden h-full">
              <CardContent className="p-4 relative">
                <div className={`absolute top-0 right-0 w-20 h-20 ${action.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
                <p className="text-xs text-slate-500">{action.description}</p>
                <ArrowRight className="w-4 h-4 text-slate-400 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}