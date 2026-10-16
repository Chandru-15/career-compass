import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from './AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Settings,
  LogOut,
  Edit,
  Award,
  Target,
} from 'lucide-react';

interface ProfilePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfilePopup({ open, onOpenChange }: ProfilePopupProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      return await dataService.getUserProfile(user.email);
    },
    enabled: !!user?.email && open,
  });

  const handleLogout = async () => {
    try {
      await logout();
      onOpenChange(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    onOpenChange(false);
    navigate(createPageUrl('Onboarding'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 bg-gradient-to-br from-teal-400 via-blue-500 to-blue-600 overflow-hidden">
        {/* Header with user info */}
        <div className="relative pt-6 px-6 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur border-4 border-white/40 shadow-lg flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold uppercase tracking-wide">{user?.full_name || 'User'}</h2>
              <p className="text-white/90 text-sm mt-1 font-medium">Job Seeker</p>
              <p className="text-white/80 mt-1 text-sm">{user?.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur px-3 py-1 whitespace-nowrap">
                {profile?.profile_completeness || 0}% Complete
              </Badge>
              {profile?.target_role && (
                <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur px-3 py-1">
                  {profile.target_role}
                </Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
            <TabsList className="w-full bg-white/20 backdrop-blur mb-4 border border-white/30">
              <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80 data-[state=active]:shadow-md">
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-white/30 data-[state=active]:text-white text-white/80 data-[state=active]:shadow-md">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <ScrollArea className="h-[400px] pr-4 px-6">
                <div className="space-y-4">
                  {/* Contact Information */}
                  <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-teal-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {profile.phone}
                        </div>
                      )}
                      {profile?.location && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {profile.location}, Singapore
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education */}
                  {(profile?.highest_degree || profile?.institution) && (
                    <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        Education
                      </h3>
                      <div className="text-sm space-y-1">
                        {profile?.highest_degree && (
                          <p className="font-medium text-slate-900">{profile.highest_degree}</p>
                        )}
                        {profile?.major && (
                          <p className="text-slate-600">{profile.major}</p>
                        )}
                        {profile?.institution && (
                          <p className="text-slate-500">{profile.institution}</p>
                        )}
                        {profile?.graduation_year && (
                          <p className="text-slate-500">Class of {profile.graduation_year}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {(profile?.hard_skills?.length > 0 || profile?.soft_skills?.length > 0) && (
                    <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        Skills
                      </h3>
                      {profile?.hard_skills?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-2">Technical Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.hard_skills.slice(0, 10).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="bg-teal-100 text-teal-700 text-xs border-teal-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile?.soft_skills?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Soft Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.soft_skills.slice(0, 10).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700 text-xs border-blue-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work Experience */}
                  {profile?.work_experience?.length > 0 && (
                    <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-amber-600" />
                        Work Experience
                      </h3>
                      <div className="space-y-3">
                        {profile.work_experience.slice(0, 3).map((exp, i) => (
                          <div key={i} className="border-l-2 border-teal-300 pl-3">
                            <p className="font-medium text-slate-900 text-sm">{exp.title}</p>
                            <p className="text-sm text-slate-600">{exp.company}</p>
                            {(exp.start_date || exp.end_date) && (
                              <p className="text-xs text-slate-500 mt-1">
                                {exp.start_date} - {exp.end_date || 'Present'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {profile?.certifications?.length > 0 && (
                    <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-600" />
                        Certifications
                      </h3>
                      <div className="space-y-2">
                        {profile.certifications.slice(0, 5).map((cert, i) => (
                          <div key={i} className="text-sm">
                            <p className="text-slate-900">{cert.title || cert}</p>
                            {cert.provider && (
                              <p className="text-xs text-slate-500">{cert.provider}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <ScrollArea className="h-[400px] pr-4 px-6">
                <div className="space-y-4">
                  <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Profile Settings</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Manage your profile information, skills, experience, and preferences.
                    </p>
                    <Button 
                      onClick={handleEditProfile}
                      className="w-full bg-white/30 backdrop-blur hover:bg-white/40 text-white border border-white/30 shadow-md"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile Details
                    </Button>
                  </div>

                  <div className="bg-white/95 backdrop-blur rounded-lg p-4 border border-white/30 shadow-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Account Information</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Full Name</p>
                        <p className="text-slate-900 font-medium">{user?.full_name}</p>
                        <p className="text-xs text-slate-400 mt-1">Name cannot be edited here</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Email Address</p>
                        <p className="text-slate-900 font-medium">{user?.email}</p>
                        <p className="text-xs text-slate-400 mt-1">Email cannot be edited here</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/30 backdrop-blur rounded-lg p-4 shadow-lg border border-white/40">
                    <h3 className="font-semibold text-white mb-2">Profile Completeness</h3>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/90">Progress</span>
                        <span className="font-semibold text-white">
                          {profile?.profile_completeness || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all shadow-sm"
                          style={{ width: `${profile?.profile_completeness || 0}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-white/80">
                      {profile?.profile_completeness < 80
                        ? 'Complete your profile to get better job recommendations'
                        : 'Your profile is well optimized!'}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 px-6 pb-6 border-t border-white/30 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-white/30 backdrop-blur border-white/40 hover:bg-white/40 text-white"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 bg-white/30 hover:bg-white/40 text-white border border-white/40 backdrop-blur shadow-md"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
