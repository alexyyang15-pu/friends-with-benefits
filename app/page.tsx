'use client';

import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { useState, useRef, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { Connection, SearchResult, ClosestConnection } from '@/lib/types';
import { Linkedin, MapPin, LayoutGrid, Map, X } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ReasonPopup } from '@/components/ui/reason-popup';
import { useWarmContacts } from '@/hooks/use-warm-contacts';
import { WarmContactToggle } from '@/components/ui/warm-contact-toggle';
import { GoToFwbPopup } from '@/components/ui/go-to-fwb-popup';
import { ContactBubble } from '@/components/ui/contact-bubble';
import { ContactDetailsModal } from '@/components/ui/contact-details-modal';
import { ScrapingProgressIndicator } from '@/components/ui/scraping-progress-indicator';
import { EnhancedScrapingIndicator } from '@/components/ui/enhanced-scraping-indicator';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ClosestConnectionsModal } from '@/components/ui/closest-connections-modal';
import { AIDiscoveredConnectionsModal } from '@/components/ui/ai-discovered-connections-modal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Typewriter } from '@/components/ui/typewriter-text';
import { EmailInputModals } from '@/components/ui/email-input-modals';
import { EmailGenerationModal } from '@/components/ui/email-generation-modal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ButtonColorful } from '@/components/ui/button-colorful';

const UserProfileUploader = dynamic(
  () =>
    import('@/components/ui/user-profile-uploader').then(
      (mod) => mod.UserProfileUploader
    ),
  {
    ssr: false,
  }
);

const ContactMap = dynamic(() => import('@/components/ui/contact-map'), {
  ssr: false,
});

type WarmContact = Connection & { lat?: number; lng?: number };

export default function Home() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    warmContacts,
    addWarmContact,
    removeWarmContact,
    isWarmContact,
    setWarmContacts,
  } = useWarmContacts(connections, setConnections);
  const [showGoToFwbPopup, setShowGoToFwbPopup] = useState(false);
  const fwbSectionRef = useRef<HTMLDivElement>(null);
  const [selectedContact, setSelectedContact] = useState<Connection | null>(
    null
  );
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState({
    total: 0,
    processed: 0,
  });
  const [fwbView, setFwbView] = useState<'bubbles' | 'map'>('bubbles');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [
    isClosestConnectionsModalOpen,
    setIsClosestConnectionsModalOpen,
  ] = useState(false);
  const [selectedIntroducer, setSelectedIntroducer] =
    useState<Connection | null>(null);
  const {
    profile: userProfile,
    setProfile: setUserProfile,
    clearProfile: clearUserProfile,
    isInitialized: isProfileInitialized,
  } = useUserProfile();
  const [isParsingProfile, setIsParsingProfile] = useState(false);

  // State for the warm intro email flow
  const [emailFlowState, setEmailFlowState] = useState<
    'idle' | 'why' | 'ask' | 'generating'
  >('idle');
  const [selectedTarget, setSelectedTarget] =
    useState<ClosestConnection | null>(null);
  const [reasonForIntroduction, setReasonForIntroduction] = useState('');
  const [askForIntroduction, setAskForIntroduction] = useState('');
  const [
    closestConnectionsCache,
    setClosestConnectionsCache,
  ] = useState<Record<string, ClosestConnection[]>>({});
  const [careerObjective, setCareerObjective] = useState('');
  const [dramaticCareerObjective, setDramaticCareerObjective] = useState('');
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [currentView, setCurrentView] = useState<
    'main' | 'uploadResume' | 'setCareerGoal'
  >('main');

  // State for AI network discovery
  const [isAIDiscoveryModalOpen, setIsAIDiscoveryModalOpen] = useState(false);
  const [selectedFWBForDiscovery, setSelectedFWBForDiscovery] = useState<Connection | null>(null);

  const handleUpdateConnectionsCache = (
    introducerUrl: string,
    results: ClosestConnection[]
  ) => {
    setClosestConnectionsCache((prevCache) => ({
      ...prevCache,
      [introducerUrl]: results,
    }));
  };

  const handleSelectTargetForIntro = (target: ClosestConnection) => {
    setSelectedTarget(target);
    setEmailFlowState('why');
    setIsClosestConnectionsModalOpen(false);
  };

  const resetEmailFlow = () => {
    setEmailFlowState('idle');
    setSelectedTarget(null);
    setReasonForIntroduction('');
    setAskForIntroduction('');
    // Keep selectedIntroducer so the context isn't lost if the user just closes the email modal
  };

  const handleScrollToFwb = () => {
    fwbSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenModal = (contact: Connection) => {
    setSelectedContact(contact);
  };

  const handleCloseModal = () => {
    setSelectedContact(null);
  };

  const handleOpenClosestConnectionsModal = (contact: Connection) => {
    if (!userProfile) {
      alert(
        "Please upload your resume (PDF) first. It's used to find the best introduction paths and generate a personalized email."
      );
      return;
    }
    setSelectedIntroducer(contact);
    setIsClosestConnectionsModalOpen(true);
  };

  const handleCloseClosestConnectionsModal = (clearContact: boolean = true) => {
    setIsClosestConnectionsModalOpen(false);
    if (clearContact) setSelectedIntroducer(null);
  };

  // AI Discovery handlers
  const handleOpenAIDiscoveryModal = (contact: Connection) => {
    if (!userProfile) {
      alert(
        "Please upload your resume (PDF) first. It's used to analyze career alignment and generate personalized introduction requests."
      );
      return;
    }
    setSelectedFWBForDiscovery(contact);
    setIsAIDiscoveryModalOpen(true);
  };

  const handleCloseAIDiscoveryModal = () => {
    setIsAIDiscoveryModalOpen(false);
    setSelectedFWBForDiscovery(null);
  };

  const handleSelectDiscoveredConnectionForIntro = (
    discoveredConnection: any, // DiscoveredConnection from AI discovery
    fwbContact: any // FWBContact (original contact that was analyzed)
  ) => {
    // Safely handle name splitting - handle undefined or empty names
    const fullName = discoveredConnection.name || 'Unknown Contact';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Convert discovered connection to ClosestConnection format for compatibility with existing email flow
    const targetForIntro: ClosestConnection = {
      'First Name': firstName,
      'Last Name': lastName,
      Position: discoveredConnection.title || 'Unknown Position',
      Company: discoveredConnection.company || 'Unknown Company',
      URL: discoveredConnection.linkedinUrl || '',
      reason: `AI discovered connection through ${fwbContact.name}: ${discoveredConnection.careerAlignment?.strategicValue?.shortTermBenefit || 'Valuable networking opportunity'}`,
      email: discoveredConnection.email || 'Not found',
    };
    
    // Set the FWB as the introducer (since they know the discovered connection)
    setSelectedIntroducer(fwbContact);
    
    // Start the email flow
    setSelectedTarget(targetForIntro);
    setEmailFlowState('why');
    
    // Close AI discovery modal
    setIsAIDiscoveryModalOpen(false);
  };

  const enrichSearchResults = async (results: SearchResult[]) => {
    setIsEnriching(true);
    const connectionsToEnrich = results.filter(
      (c) =>
        c.URL &&
        (!c.location ||
          c.location === 'Unknown' ||
          c.location === 'Send profile in a message')
    );

    setEnrichmentProgress({
      total: connectionsToEnrich.length,
      processed: 0,
    });

    for (let i = 0; i < connectionsToEnrich.length; i++) {
      const connection = connectionsToEnrich[i];
      try {
        // First, try Stagehand scraping
        let location = null;
        
        try {
          const stagehandResponse = await fetch('/api/scrape-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileUrl: connection.URL,
              connectionData: connection,
            }),
          });

          if (stagehandResponse.ok) {
            const stagehandResult = await stagehandResponse.json();
            location = stagehandResult.location;
            console.log(`Stagehand found location: ${location}`);
          } else {
            const errorResult = await stagehandResponse.json();
            if (errorResult.fallbackToAI) {
              console.log('Stagehand failed, falling back to AI method');
            }
          }
        } catch (stagehandError) {
          console.log('Stagehand scraping failed, trying AI fallback:', stagehandError);
        }

        // If Stagehand didn't find a location, fall back to AI enrichment
        if (!location) {
          try {
            const aiResponse = await fetch('/api/enrich-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(connection),
            });

            if (aiResponse.ok) {
              const aiResult = await aiResponse.json();
              location = aiResult.location;
              console.log(`AI found location: ${location}`);
            }
          } catch (aiError) {
            console.error('AI enrichment also failed:', aiError);
          }
        }

        // Update state if we found a location from either method
        if (location) {
          const updateState = (prevState: any[]): any[] =>
            prevState.map((c) =>
              c.URL === connection.URL ? { ...c, location } : c
            );

          setConnections(updateState);
          setSearchResults(updateState);
        }
      } catch (e) {
        console.error('Overall enrichment failed for a connection', e);
      } finally {
        // Update progress
        setEnrichmentProgress(prev => ({
          ...prev,
          processed: i + 1,
        }));
        
        // Add small delay to avoid overwhelming LinkedIn
        if (i < connectionsToEnrich.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    setIsEnriching(false);
  };

  const geocodeWarmContacts = useCallback(async () => {
    const contactsToGeocode = warmContacts.filter(
      (c) => c.location && c.location !== 'Unknown' && !c.lat && !c.lng
    );

    if (contactsToGeocode.length === 0) return;

    setIsGeocoding(true);

    const geocodePromises = contactsToGeocode.map(async (contact) => {
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: contact.location }),
        });

        if (response.ok) {
          const { lat, lng } = await response.json();
          return { ...contact, lat, lng };
        }
      } catch (e) {
        console.error('Geocoding failed for a contact', e);
      }
      return contact; // Return original contact if geocoding fails
    });

    const geocodedResults = await Promise.all(geocodePromises);

    const updatedConnections = connections.map((oldContact) => {
      const updated = geocodedResults.find((c) => c.URL === oldContact.URL);
      return updated || oldContact;
    });
    setConnections(updatedConnections);

    setIsGeocoding(false);
  }, [warmContacts, setWarmContacts, connections]);

  useEffect(() => {
    if (fwbView === 'map' && warmContacts.length > 0) {
      const needsGeocoding = warmContacts.some(
        (c) => c.location && c.location !== 'Unknown' && !c.lat && !c.lng
      );
      if (needsGeocoding) {
        geocodeWarmContacts();
      }
    }
  }, [fwbView, warmContacts, geocodeWarmContacts]);

  const handleSearch = async () => {
    if (!searchQuery) return;

    setIsProcessing(true);
    setHasSearched(true);
    setError('');

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, connections }),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const { results } = await response.json();
      setSearchResults(results);
      // Automatically enrich results after fetching them
      enrichSearchResults(results);
    } catch (err: any) {
      setError(`Error during search: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsProcessing(true);
    setError('');

    Papa.parse<Connection>(file, {
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<string[]>) => {
        if (results.data.length < 4) {
          setError(
            'Invalid CSV format. Please ensure you are uploading the `Connections.csv` file from the larger data archive from your LinkedIn export.'
          );
          setIsProcessing(false);
          return;
        }

        const headers = results.data[2]; // Use row 3 for headers
        const dataRows = results.data.slice(3); // Data starts from row 4

        const requiredFields = [
          'First Name',
          'Last Name',
          'Company',
          'Position',
          'Connected On',
          'URL',
        ];

        if (
          headers &&
          requiredFields.every((field) => headers.includes(field))
        ) {
          const connectionsData = dataRows.map((row) => {
            const connection: any = {};
            headers.forEach((header, i) => {
              connection[header] = row[i];
            });
            return connection as Connection;
          });
          setConnections(connectionsData);
        } else {
          setError(
            'Header validation failed. Please ensure you are uploading the correct `Connections.csv` file.'
          );
        }
        setIsProcessing(false);
      },
      error: (err) => {
        setError(`Error parsing CSV file: ${err.message}`);
        setIsProcessing(false);
      },
    });
  };

  const handleSaveGoal = async () => {
    if (!careerObjective) {
      setCurrentView('main');
      return;
    }

    setIsGeneratingGoal(true);
    try {
      const response = await fetch('/api/generate-dramatic-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: careerObjective }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate dramatic goal.');
      }

      const { dramaticGoal } = await response.json();
      setDramaticCareerObjective(dramaticGoal);
    } catch (error) {
      console.error(error);
      // Fallback to the original objective if generation fails
      setDramaticCareerObjective(careerObjective);
    } finally {
      setIsGeneratingGoal(false);
      setCurrentView('main');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Title and View-switching Buttons in upper left */}
      <div className="absolute top-4 left-4 flex flex-col items-start space-y-2 z-10">
        <h1 className="text-3xl font-bold text-gray-800">fwb</h1>
        {connections.length > 0 && (
          <div className="flex space-x-2">
            <ButtonColorful
              label={userProfile ? 'Update Resume' : 'Upload Resume'}
              onClick={() => setCurrentView('uploadResume')}
              className="h-9"
            />
            <ButtonColorful
              label={careerObjective ? 'Update Goal' : 'Set Career Goal'}
              onClick={() => setCurrentView('setCareerGoal')}
              className="h-9"
            />
          </div>
        )}
      </div>

      {/* Centered content */}
      <div
        className={`min-h-screen flex flex-col items-center px-4 ${
          hasSearched && currentView === 'main'
            ? 'justify-start pt-32'
            : 'justify-center'
        }`}
      >
        {connections.length === 0 ? (
          <div className="text-center">
            <h2 className="text-4xl font-semibold mb-8 text-gray-700">
              Upload Your LinkedIn Connections
            </h2>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-4 text-gray-500"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload `Connections.csv` from your LinkedIn data export
                    archive.
                  </p>
                  <a
                    href="https://www.linkedin.com/settings/data-export-page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1"
                  >
                    Click here to request your data archive from LinkedIn.
                  </a>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>
            </div>
            {isProcessing && (
              <p className="mt-4 text-blue-600">Processing file...</p>
            )}
            {error && <p className="mt-4 text-red-600">{error}</p>}
          </div>
        ) : (
          <>
            {currentView === 'main' && (
              <>
                {/* User Profile Section */}
                {isProfileInitialized && userProfile && (
                  <div className="w-full max-w-3xl mb-4 flex flex-col items-center justify-center">
                    <TextShimmerWave
                      as="h2"
                      className="text-3xl font-medium mb-2 text-gray-600 [--base-color:#6B7280] [--base-gradient-color:#2563EB]"
                      duration={1.5}
                      spread={1.2}
                    >
                      You are...
                    </TextShimmerWave>
                    <div className="w-full text-center relative min-h-[30px]">
                      <Typewriter
                        text={userProfile.dramaticSummary}
                        speed={50}
                        className="text-xl font-medium text-gray-800"
                        cursor=""
                      />
                    </div>
                  </div>
                )}

                {/* Career Goal Section */}
                {dramaticCareerObjective && (
                  <div className="w-full max-w-3xl mb-4 flex flex-col items-center justify-center">
                    <TextShimmerWave
                      as="h2"
                      className="text-3xl font-medium mb-2 text-gray-600 [--base-color:#6B7280] [--base-gradient-color:#2563EB]"
                      duration={1.5}
                      spread={1.2}
                    >
                      You want to...
                    </TextShimmerWave>
                    <div className="w-full text-center relative min-h-[30px]">
                      <Typewriter
                        text={dramaticCareerObjective}
                        speed={50}
                        className="text-xl font-medium text-gray-800"
                        cursor=""
                      />
                    </div>
                  </div>
                )}

                {/* Main Question with Shimmer Wave Animation */}
                {!hasSearched && (
                  <TextShimmerWave
                    as="h2"
                    className="text-6xl font-semibold mb-12 [--base-color:#4B5563] [--base-gradient-color:#2563EB]"
                    duration={1.5}
                    spread={1.2}
                    zDistance={15}
                    scaleDistance={1.15}
                    rotateYDistance={15}
                  >
                    Who do you want to meet?
                  </TextShimmerWave>
                )}

                {/* Search Box */}
                <div className="w-full max-w-2xl">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VCs in New York, Product Managers at Google, Founders in fintech..."
                      className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-300 focus:border-blue-500 focus:outline-none shadow-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors"
                      onClick={handleSearch}
                      disabled={isProcessing}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {hasSearched && (
                  <div className="w-full max-w-4xl mt-12">
                    {isProcessing ? (
                      <div className="flex flex-col items-center">
                        <p className="text-center text-blue-600 mb-2">
                          Analyzing connections...
                        </p>
                        <ProgressBar />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {/* Enhanced Location Scraping Indicator */}
                        <EnhancedScrapingIndicator
                          isActive={isEnriching}
                          totalConnections={enrichmentProgress.total}
                          processedConnections={enrichmentProgress.processed}
                        />
                        
                        <ul className="bg-white rounded-lg shadow-lg p-4 divide-y divide-gray-200">
                          {searchResults.slice(0, 10).map((conn) => (
                            <li
                              key={conn.URL}
                              className="py-4 px-2 flex justify-between items-center"
                            >
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                  {conn['First Name']} {conn['Last Name']}
                                  {conn.reason && (
                                    <ReasonPopup reason={conn.reason} />
                                  )}
                                </h3>
                                <p className="text-md text-gray-600">
                                  {conn.Position}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {conn.Company}
                                </p>
                                {conn.location &&
                                  conn.location !== 'Unknown' &&
                                  conn.location !==
                                    'Send profile in a message' && (
                                    <div className="flex items-center text-gray-500 mt-1 text-sm">
                                      <MapPin size={14} className="mr-1.5" />
                                      <p>{conn.location}</p>
                                    </div>
                                  )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <a
                                  href={conn.URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  <Linkedin size={24} />
                                </a>
                                <WarmContactToggle
                                  isToggled={isWarmContact(conn.URL)}
                                  onToggle={() => {
                                    if (isWarmContact(conn.URL)) {
                                      removeWarmContact(conn.URL);
                                    } else {
                                      addWarmContact(conn.URL);
                                      setShowGoToFwbPopup(true);
                                    }
                                  }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-center text-gray-500">
                        No connections found.
                      </p>
                    )}
                  </div>
                )}
                {/* Warm Contacts Section */}
                {warmContacts.length > 0 && (
                  <div ref={fwbSectionRef} className="w-full max-w-4xl mt-8">
                    <div className="text-center mb-6">
                      <div className="flex justify-center items-center mb-4">
                        <h2 className="text-3xl font-bold text-center text-gray-800">
                          Your fwb
                        </h2>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="ml-2 -mt-1 h-6 w-6 p-0 rounded-full"
                            >
                              <span className="text-sm font-bold">?</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="max-w-sm text-sm"
                            side="top"
                          >
                            <p>
                              Your fwb are friends who you&apos;re willing to make
                              warm intros to. and friends who you want warm
                              intros from. &quot;Your fwb&quot; list is visible
                              to others and others can only request intros to
                              people on &quot;Your fwb&quot; list
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <p className="text-center text-gray-500 mt-2 mb-6 max-w-2xl mx-auto">
                      These are the people you trust. Click the heart on a
                      search result to add them to your fwb list.
                    </p>

                    {fwbView === 'bubbles' ? (
                      <div className="flex flex-wrap justify-center items-center">
                        {warmContacts.map((conn) => (
                          <ContactBubble
                            key={conn.URL}
                            contact={conn}
                            onClick={() => handleOpenModal(conn)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        {isGeocoding && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                            <p className="text-blue-600">
                              Plotting locations on the map...
                            </p>
                          </div>
                        )}
                        <ContactMap
                          key={warmContacts.filter((c) => c.lat).length}
                          contacts={warmContacts}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {currentView === 'uploadResume' && (
              <div className="w-full max-w-3xl flex flex-col items-center justify-center">
                <div className="w-full relative">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="absolute -top-12 right-0 text-gray-500 hover:text-gray-800 z-20"
                  >
                    <X size={24} />
                  </button>

                  {userProfile && (
                    <div className="w-full max-w-3xl mb-8 flex flex-col items-center justify-center">
                      <TextShimmerWave
                        as="h2"
                        className="text-3xl font-medium mb-2 text-gray-600 [--base-color:#6B7280] [--base-gradient-color:#2563EB]"
                        duration={1.5}
                        spread={1.2}
                      >
                        You are...
                      </TextShimmerWave>
                      <div className="w-full text-center relative min-h-[30px]">
                        <Typewriter
                          text={userProfile.dramaticSummary}
                          speed={50}
                          className="text-xl font-medium text-gray-800"
                          cursor=""
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <UserProfileUploader
                      onUploadSuccess={(profile) => {
                        setUserProfile(profile);
                        setCurrentView('main');
                      }}
                      isProcessing={isParsingProfile}
                      setIsProcessing={setIsParsingProfile}
                      label="Update your resume"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentView === 'setCareerGoal' && (
              <div className="w-full max-w-2xl text-center">
                <div className="w-full relative">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="absolute -top-4 right-0 text-gray-500 hover:text-gray-800 z-20"
                  >
                    <X size={24} />
                  </button>
                  <label
                    htmlFor="career-objective"
                    className="block text-3xl font-medium text-gray-700 mb-4"
                  >
                    What is your career goal?
                  </label>
                  <textarea
                    id="career-objective"
                    rows={4}
                    className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none shadow-lg transition"
                    placeholder="e.g., Find a new job, pivot to a new industry like fintech, or network with other entrepreneurs..."
                    value={careerObjective}
                    onChange={(e) => setCareerObjective(e.target.value)}
                  />
                  <p className="text-md text-gray-500 mt-3">
                    The more detail you provide, the more we can help.
                  </p>
                  <ButtonColorful
                    label={isGeneratingGoal ? 'Saving...' : 'Save Goal'}
                    onClick={handleSaveGoal}
                    className="mt-6"
                    disabled={isGeneratingGoal}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <GoToFwbPopup
        show={showGoToFwbPopup}
        onClose={() => setShowGoToFwbPopup(false)}
        onGoToFwb={handleScrollToFwb}
      />
      <ContactDetailsModal
        contact={selectedContact}
        onClose={handleCloseModal}
        isWarmContact={isWarmContact}
        addWarmContact={addWarmContact}
        removeWarmContact={removeWarmContact}
        onFindClosestConnections={handleOpenClosestConnectionsModal}
        onAIDiscoverNetwork={handleOpenAIDiscoveryModal}
        hasGeneratedConnections={
          !!(
            selectedContact &&
            closestConnectionsCache[selectedContact.URL]
          )
        }
      />
      <ClosestConnectionsModal
        isOpen={isClosestConnectionsModalOpen}
        onClose={() => handleCloseClosestConnectionsModal(true)}
        introducer={selectedIntroducer}
        allConnections={connections}
        userProfile={userProfile}
        onSelectTarget={handleSelectTargetForIntro}
        cachedResults={
          selectedIntroducer
            ? closestConnectionsCache[selectedIntroducer.URL]
            : undefined
        }
        onCacheUpdate={handleUpdateConnectionsCache}
        careerObjective={careerObjective}
      />
      <EmailInputModals
        flowState={
          emailFlowState === 'why' || emailFlowState === 'ask'
            ? emailFlowState
            : 'why'
        }
        onClose={resetEmailFlow}
        targetContact={selectedTarget}
        introducerContact={selectedIntroducer}
        reason={reasonForIntroduction}
        setReason={setReasonForIntroduction}
        ask={askForIntroduction}
        setAsk={setAskForIntroduction}
        onNext={() => setEmailFlowState('ask')}
        onBack={() => setEmailFlowState('why')}
        onGenerate={() => setEmailFlowState('generating')}
      />
      <EmailGenerationModal
        isOpen={emailFlowState === 'generating'}
        onClose={resetEmailFlow}
        userProfile={userProfile}
        targetContact={selectedTarget}
        introducerContact={selectedIntroducer}
        reasonForIntroduction={reasonForIntroduction}
        ask={askForIntroduction}
        careerObjective={careerObjective}
      />
      <AIDiscoveredConnectionsModal
        isOpen={isAIDiscoveryModalOpen}
        onClose={handleCloseAIDiscoveryModal}
        fwbContact={selectedFWBForDiscovery ? {
          name: `${selectedFWBForDiscovery['First Name']} ${selectedFWBForDiscovery['Last Name']}`,
          company: selectedFWBForDiscovery.Company,
          position: selectedFWBForDiscovery.Position,
          linkedinUrl: selectedFWBForDiscovery.URL
        } : null}
        userProfile={userProfile}
        careerObjective={careerObjective}
        onSelectForIntroduction={handleSelectDiscoveredConnectionForIntro}
      />
    </div>
  );
}
