'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  TrendingUp, 
  Mail, 
  MapPin, 
  Building2, 
  Clock, 
  Target, 
  Lightbulb,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
  SortDesc
} from 'lucide-react';
import { UserProfile } from '@/hooks/useUserProfile';
import { useAINetworkDiscovery, DiscoveredConnection, AINetworkDiscoveryResult, FWBContact } from '@/hooks/use-ai-network-discovery';

interface AIDiscoveredConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fwbContact: FWBContact | null;
  userProfile: UserProfile | null;
  careerObjective?: string;
  onSelectForIntroduction?: (connection: DiscoveredConnection, fwbContact: FWBContact) => void;
}

interface FilterCriteria {
  minNetworkingValue: number;
  evidenceStrength: 'all' | 'high' | 'medium' | 'low';
  contactMethod: 'all' | 'linkedin' | 'email' | 'mutual_connection';
}

interface SortCriteria {
  field: 'networkingPriority' | 'careerAlignment' | 'evidenceStrength';
  direction: 'desc' | 'asc';
}

export const AIDiscoveredConnectionsModal = ({
  isOpen,
  onClose,
  fwbContact,
  userProfile,
  careerObjective,
  onSelectForIntroduction
}: AIDiscoveredConnectionsModalProps) => {
  const [selectedConnection, setSelectedConnection] = useState<DiscoveredConnection | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  
  const [filters, setFilters] = useState<FilterCriteria>({
    minNetworkingValue: 1,
    evidenceStrength: 'all',
    contactMethod: 'all'
  });
  
  const [sortBy, setSortBy] = useState<SortCriteria>({
    field: 'networkingPriority',
    direction: 'desc'
  });

  const {
    isLoading,
    error,
    result,
    phase,
    discoverNetwork,
    getStatusMessage,
    getProgress,
    clearResult
  } = useAINetworkDiscovery({
    onSuccess: (result) => {
      console.log('AI discovery completed:', result);
    },
    onError: (error) => {
      console.error('AI discovery error:', error);
    }
  });

  // Start discovery when modal opens
  useEffect(() => {
    if (isOpen && fwbContact && userProfile && !result && !isLoading) {
      discoverNetwork(fwbContact, userProfile, careerObjective);
    }
  }, [isOpen, fwbContact, userProfile, careerObjective, result, isLoading, discoverNetwork]);

  // Clear result when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearResult();
      setSelectedConnection(null);
    }
  }, [isOpen, clearResult]);

  // Filter and sort connections
  const filteredAndSortedConnections = result?.discoveredConnections
    ?.filter(connection => {
      if (connection.networkingValue < filters.minNetworkingValue) return false;
      if (filters.evidenceStrength !== 'all' && connection.evidenceStrength !== filters.evidenceStrength) return false;
      if (filters.contactMethod !== 'all' && connection.contactMethod !== filters.contactMethod) return false;
      return true;
    })
    ?.sort((a, b) => {
      const multiplier = sortBy.direction === 'desc' ? -1 : 1;
      switch (sortBy.field) {
        case 'networkingPriority':
          return (a.networkingPriority - b.networkingPriority) * multiplier;
        case 'careerAlignment':
          return (a.careerAlignment.overallScore - b.careerAlignment.overallScore) * multiplier;
        case 'evidenceStrength':
          const strengthOrder = { high: 3, medium: 2, low: 1 };
          return (strengthOrder[a.evidenceStrength] - strengthOrder[b.evidenceStrength]) * multiplier;
        default:
          return 0;
      }
    }) || [];

  const handleCopyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getEvidenceColor = (strength: 'high' | 'medium' | 'low') => {
    switch (strength) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
    }
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderLoadingState = () => (
    <div className="text-center p-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="inline-block mb-4"
      >
        <Loader2 className="h-12 w-12 text-blue-600" />
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        AI Discovering {fwbContact?.name}'s Network
      </h3>
      <p className="text-gray-600 mb-4">{getStatusMessage()}</p>
      <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${getProgress()}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">{getProgress()}% complete</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center p-12">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Discovery Failed</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => fwbContact && userProfile && discoverNetwork(fwbContact, userProfile, careerObjective)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );

  const renderConnectionCard = (connection: DiscoveredConnection, index: number) => (
    <motion.div
      key={`connection-${index}-${connection.name || 'unknown'}-${connection.company || 'no-company'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedConnection(connection)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800">{connection.name || 'Unknown Contact'}</h4>
          <p className="text-gray-600">{connection.title || 'Unknown Position'}</p>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <Building2 className="h-4 w-4 mr-1" />
            {connection.company || 'Unknown Company'}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className={`font-semibold ${getAlignmentColor(connection.careerAlignment?.overallScore || 0)}`}>
              {connection.careerAlignment?.overallScore || 0}%
            </span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${getEvidenceColor(connection.evidenceStrength || 'low')}`}>
            {connection.evidenceStrength || 'unknown'} evidence
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          <strong>Connection:</strong> {connection.relationshipToFWB || 'Unknown relationship'}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Career Relevance:</strong> {connection.careerRelevance || 'Potential networking opportunity'}
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">
            Networking Priority: {connection.networkingPriority || connection.networkingValue || 5}/10
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectForIntroduction?.(connection, fwbContact!);
            }}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm">Request Intro</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderConnectionDetails = (connection: DiscoveredConnection) => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="bg-gray-50 p-6 overflow-y-auto"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{connection.name}</h3>
          <p className="text-gray-600">{connection.title} at {connection.company}</p>
        </div>
        <button
          onClick={() => setSelectedConnection(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Career Alignment Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Career Alignment
        </h4>
        <div className="bg-white rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getAlignmentColor(connection.careerAlignment.overallScore)}`}>
                {connection.careerAlignment.overallScore}%
              </div>
              <div className="text-sm text-gray-500">Overall Match</div>
            </div>
            <div className="space-y-2">
              {Object.entries(connection.careerAlignment.alignmentFactors).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-semibold">{value}/10</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Value Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Strategic Value
        </h4>
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div>
            <strong>Short-term benefit:</strong>
            <p className="text-gray-600">{connection.careerAlignment.strategicValue.shortTermBenefit}</p>
          </div>
          <div>
            <strong>Long-term benefit:</strong>
            <p className="text-gray-600">{connection.careerAlignment.strategicValue.longTermBenefit}</p>
          </div>
          <div>
            <strong>Key opportunities:</strong>
            <ul className="text-gray-600 list-disc list-inside">
              {connection.careerAlignment.strategicValue.keyOpportunities.map((opportunity, index) => (
                <li key={index}>{opportunity}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Networking Advice Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          Networking Strategy
        </h4>
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div>
            <strong>Approach:</strong>
            <p className="text-gray-600">{connection.careerAlignment.actionableInsights.approachStrategy}</p>
          </div>
          <div>
            <strong>Timeline:</strong>
            <p className="text-gray-600">{connection.careerAlignment.actionableInsights.timeline}</p>
          </div>
          <div>
            <strong>Conversation starters:</strong>
            <div className="space-y-2 mt-2">
              {connection.careerAlignment.actionableInsights.conversationStarters.map((starter, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-600">"{starter}"</span>
                  <button
                    onClick={() => handleCopyToClipboard(starter, `starter-${index}`)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {copiedStates[`starter-${index}`] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Evidence Sources</h4>
        <div className="bg-white rounded-lg p-4">
          <div className="space-y-2">
            {connection.evidenceSources.map((source, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <ExternalLink className="h-4 w-4 mr-2" />
                {source}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => onSelectForIntroduction?.(connection, fwbContact!)}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" />
          <span>Request Introduction</span>
        </button>
        {connection.linkedinUrl && (
          <button
            onClick={() => window.open(connection.linkedinUrl, '_blank')}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );

  const renderResults = () => {
    if (!result || filteredAndSortedConnections.length === 0) {
      return (
        <div className="text-center p-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Connections Found</h3>
          <p className="text-gray-600">
            We couldn't find any relevant connections in {fwbContact?.name}'s network based on your criteria.
          </p>
        </div>
      );
    }

    return (
      <div className="flex h-full">
        {/* Connections List */}
        <div className={`transition-all duration-300 ${selectedConnection ? 'w-1/2' : 'w-full'}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Discovered Connections ({filteredAndSortedConnections.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <Filter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSortBy(prev => ({
                    ...prev,
                    direction: prev.direction === 'desc' ? 'asc' : 'desc'
                  }))}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <SortDesc className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Networking Value
                      </label>
                      <select
                        value={filters.minNetworkingValue}
                        onChange={(e) => setFilters(prev => ({ ...prev, minNetworkingValue: Number(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Evidence Strength
                      </label>
                      <select
                        value={filters.evidenceStrength}
                        onChange={(e) => setFilters(prev => ({ ...prev, evidenceStrength: e.target.value as any }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="all">All</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Method
                      </label>
                      <select
                        value={filters.contactMethod}
                        onChange={(e) => setFilters(prev => ({ ...prev, contactMethod: e.target.value as any }))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="all">All</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="email">Email</option>
                        <option value="mutual_connection">Mutual Connection</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
            <div className="space-y-4">
              {filteredAndSortedConnections.map((connection, index) => 
                renderConnectionCard(connection, index)
              )}
            </div>
          </div>
        </div>

        {/* Connection Details Panel */}
        <AnimatePresence>
          {selectedConnection && (
            <div className="w-1/2 border-l border-gray-200">
              {renderConnectionDetails(selectedConnection)}
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[80vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {isLoading && renderLoadingState()}
            {error && renderErrorState()}
            {result && renderResults()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 