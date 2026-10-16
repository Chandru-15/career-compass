import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, MinusCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  matched: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Matched' },
  partial: { icon: MinusCircle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Partial' },
  missing: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Missing' },
};

export function SkillsGapChart({ skills = [], targetRole, onAddToRoadmap }) {
  const matchedCount = skills.filter(s => s.status === 'matched').length;
  const totalCount = skills.length || 1;
  const matchPercentage = Math.round((matchedCount / totalCount) * 100);

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Skills Gap Analysis</CardTitle>
            <p className="text-sm text-slate-500 mt-1">For {targetRole || 'your target role'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-600">{matchPercentage}%</p>
            <p className="text-xs text-slate-500">Skills matched</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {skills.map((skill, index) => {
            const config = statusConfig[skill.status];
            const Icon = config.icon;
            
            return (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl transition-all',
                  config.bg
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-5 h-5', config.color)} />
                  <div>
                    <p className="font-medium text-slate-900">{skill.name}</p>
                    <p className="text-xs text-slate-500">
                      {skill.status === 'matched' && 'You have this skill'}
                      {skill.status === 'partial' && 'Some experience needed'}
                      {skill.status === 'missing' && 'Required skill'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('border-0', config.bg, config.color)}>
                    {config.label}
                  </Badge>
                  {skill.status !== 'matched' && onAddToRoadmap && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      onClick={() => onAddToRoadmap(skill)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add to roadmap
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}