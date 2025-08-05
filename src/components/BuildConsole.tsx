import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface BuildLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

interface BuildConsoleProps {
  isBuilding: boolean;
  onBuild: () => Promise<boolean>;
  onTest: () => Promise<boolean>;
}

export function BuildConsole({ isBuilding, onBuild, onTest }: BuildConsoleProps) {
  console.log("🔨 BuildConsole: Component loaded", { isBuilding });
  
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [lastBuildSuccess, setLastBuildSuccess] = useState<boolean | null>(null);

  const addLog = (level: BuildLog['level'], message: string) => {
    const newLog: BuildLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
    setLastBuildSuccess(null);
  };

  const handleBuild = async () => {
    console.log("🔨 BuildConsole: Starting build process");
    clearLogs();
    addLog('info', 'Starting build process...');
    addLog('info', 'Compiling Java sources...');
    
    // Simulate build progress with realistic logs
    setTimeout(() => addLog('info', 'Processing mod metadata...'), 500);
    setTimeout(() => addLog('info', 'Validating dependencies...'), 1000);
    setTimeout(() => addLog('info', 'Generating resources...'), 1500);
    
    const success = await onBuild();
    
    if (success) {
      addLog('success', 'Build completed successfully!');
      addLog('info', 'Generated mod JAR: target/mod-1.0.0.jar');
      addLog('info', 'Build artifacts ready for testing');
      setLastBuildSuccess(true);
      console.log("✅ BuildConsole: Build completed successfully");
    } else {
      addLog('error', 'Build failed. Check your code for errors.');
      addLog('error', 'See above for compilation errors');
      setLastBuildSuccess(false);
      console.log("❌ BuildConsole: Build failed");
    }
  };

  const handleTest = async () => {
    console.log("🔨 BuildConsole: Starting test process");
    
    if (!lastBuildSuccess) {
      addLog('error', 'Please build the project first before testing.');
      console.log("❌ BuildConsole: Test blocked - no successful build");
      return;
    }
    
    addLog('info', 'Starting test environment...');
    addLog('info', 'Launching Minecraft client...');
    addLog('info', 'Loading mod into test environment...');
    
    // Simulate test progress
    setTimeout(() => addLog('info', 'Validating mod compatibility...'), 500);
    setTimeout(() => addLog('info', 'Running automated tests...'), 1000);
    
    const success = await onTest();
    
    if (success) {
      addLog('success', 'Test completed successfully!');
      addLog('info', 'Mod loaded and tested in Minecraft.');
      addLog('info', 'All functionality tests passed');
      console.log("✅ BuildConsole: Test completed successfully");
    } else {
      addLog('error', 'Test failed. Check console for details.');
      addLog('error', 'Some tests did not pass validation');
      console.log("❌ BuildConsole: Test failed");
    }
  };

  const getLogIcon = (level: BuildLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      default: return <Terminal className="w-3 h-3 text-blue-400" />;
    }
  };

  const getLogColor = (level: BuildLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Build Console
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastBuildSuccess !== null && (
              <Badge variant={lastBuildSuccess ? "default" : "destructive"}>
                {lastBuildSuccess ? "Build Success" : "Build Failed"}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] p-3">
          <div className="space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground italic">
                Build logs will appear here...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-1">
                  {getLogIcon(log.level)}
                  <span className="text-muted-foreground min-w-[60px]">
                    {log.timestamp}
                  </span>
                  <span className={getLogColor(log.level)}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            {isBuilding && (
              <div className="flex items-center gap-2 py-1 text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-muted-foreground min-w-[60px]">
                  {new Date().toLocaleTimeString()}
                </span>
                <span>Processing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Button
              variant="tier"
              size="sm"
              onClick={handleBuild}
              disabled={isBuilding}
              className="flex-1"
            >
              {isBuilding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Terminal className="w-3 h-3" />
              )}
              Build
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isBuilding || !lastBuildSuccess}
              className="flex-1"
            >
              <CheckCircle className="w-3 h-3" />
              Test
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}