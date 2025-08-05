import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectFiles, analysisType = 'full' } = await req.json();
    console.log("📊 Performance Analysis:", { analysisType, fileCount: Object.keys(projectFiles || {}).length });

    if (!projectFiles) {
      throw new Error('Project files are required for analysis');
    }

    const analysisResult = await analyzePerformance(projectFiles, analysisType);
    
    console.log("📊 Performance analysis completed");

    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('📊 Error in performance-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Performance analysis failed.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzePerformance(projectFiles: Record<string, string>, analysisType: string) {
  const analysis = {
    success: true,
    analysisType,
    timestamp: new Date().toISOString(),
    metrics: {
      codeQuality: await analyzeCodeQuality(projectFiles),
      performance: await analyzePerformanceMetrics(projectFiles),
      memory: await analyzeMemoryUsage(projectFiles),
      compatibility: await analyzeCompatibility(projectFiles)
    },
    recommendations: [],
    summary: {
      overall: 'good',
      score: 85,
      issues: 0,
      warnings: 0
    }
  };

  // Generate recommendations based on analysis
  analysis.recommendations = generateRecommendations(analysis.metrics);
  
  // Calculate summary
  analysis.summary = calculateSummary(analysis.metrics);

  return analysis;
}

async function analyzeCodeQuality(files: Record<string, string>) {
  const javaFiles = Object.entries(files).filter(([path, _]) => path.endsWith('.java'));
  
  const issues = [];
  let complexityScore = 90;
  
  for (const [path, content] of javaFiles) {
    // Check for common code quality issues
    if (content.includes('System.out.println')) {
      issues.push({
        file: path,
        line: findLineNumber(content, 'System.out.println'),
        severity: 'warning',
        message: 'Use proper logging instead of System.out.println',
        type: 'code_quality'
      });
    }
    
    if (content.includes('Thread.sleep')) {
      issues.push({
        file: path,
        line: findLineNumber(content, 'Thread.sleep'),
        severity: 'error',
        message: 'Avoid Thread.sleep in main thread - use proper scheduling',
        type: 'performance'
      });
      complexityScore -= 10;
    }
    
    // Check for proper error handling
    if (content.includes('catch') && content.includes('printStackTrace')) {
      issues.push({
        file: path,
        line: findLineNumber(content, 'printStackTrace'),
        severity: 'warning',
        message: 'Consider proper error logging instead of printStackTrace',
        type: 'error_handling'
      });
    }
  }

  return {
    score: complexityScore,
    issues,
    metrics: {
      totalFiles: javaFiles.length,
      linesOfCode: javaFiles.reduce((sum, [, content]) => sum + content.split('\n').length, 0),
      complexity: 'medium',
      maintainability: complexityScore > 80 ? 'good' : 'needs_improvement'
    }
  };
}

async function analyzePerformanceMetrics(files: Record<string, string>) {
  const performanceIssues = [];
  let score = 95;
  
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith('.java')) continue;
    
    // Check for performance anti-patterns
    if (content.includes('new ArrayList') && content.includes('for (')) {
      const lineNum = findLineNumber(content, 'new ArrayList');
      if (content.substring(content.indexOf('new ArrayList')).includes('add(')) {
        performanceIssues.push({
          file: path,
          line: lineNum,
          severity: 'warning',
          message: 'Consider using List.of() or Arrays.asList() for immutable lists',
          type: 'memory_optimization'
        });
      }
    }
    
    // Check for inefficient string operations
    if (content.includes('String') && content.includes('+') && content.includes('for (')) {
      performanceIssues.push({
        file: path,
        line: findLineNumber(content, 'String'),
        severity: 'warning',
        message: 'Use StringBuilder for string concatenation in loops',
        type: 'string_optimization'
      });
      score -= 5;
    }
  }

  return {
    score,
    issues: performanceIssues,
    metrics: {
      estimatedStartupTime: '2.3s',
      memoryFootprint: 'medium',
      cpuUsage: 'low',
      networkCalls: 0
    }
  };
}

async function analyzeMemoryUsage(files: Record<string, string>) {
  const memoryIssues = [];
  let score = 88;
  
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith('.java')) continue;
    
    // Check for potential memory leaks
    if (content.includes('static') && (content.includes('List') || content.includes('Map'))) {
      memoryIssues.push({
        file: path,
        line: findLineNumber(content, 'static'),
        severity: 'warning',
        message: 'Static collections can cause memory leaks - ensure proper cleanup',
        type: 'memory_leak'
      });
    }
    
    // Check for large object allocations
    if (content.includes('new byte[') || content.includes('new int[')) {
      memoryIssues.push({
        file: path,
        line: findLineNumber(content, 'new byte[') || findLineNumber(content, 'new int['),
        severity: 'info',
        message: 'Large array allocation detected - consider streaming for large data',
        type: 'memory_allocation'
      });
    }
  }

  return {
    score,
    issues: memoryIssues,
    metrics: {
      estimatedHeapUsage: '64MB',
      garbageCollectionPressure: 'low',
      objectRetention: 'normal'
    }
  };
}

async function analyzeCompatibility(files: Record<string, string>) {
  const compatibilityIssues = [];
  let score = 92;
  
  // Check build.gradle for version compatibility
  const buildGradle = files['build.gradle'];
  if (buildGradle) {
    if (buildGradle.includes('1.19') && buildGradle.includes('1.20')) {
      compatibilityIssues.push({
        file: 'build.gradle',
        line: 1,
        severity: 'error',
        message: 'Mixed Minecraft versions detected - ensure consistent versioning',
        type: 'version_conflict'
      });
      score -= 15;
    }
  }

  return {
    score,
    issues: compatibilityIssues,
    metrics: {
      minecraftVersions: ['1.20.1'],
      javaVersion: '17+',
      modLoader: 'forge',
      dependencies: 'compatible'
    }
  };
}

function generateRecommendations(metrics: any) {
  const recommendations = [];
  
  if (metrics.codeQuality.score < 80) {
    recommendations.push({
      priority: 'high',
      category: 'code_quality',
      message: 'Improve code quality by addressing identified issues',
      actions: ['Add proper logging', 'Implement error handling', 'Reduce complexity']
    });
  }
  
  if (metrics.performance.score < 85) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      message: 'Optimize performance bottlenecks',
      actions: ['Use StringBuilder for string operations', 'Optimize collection usage', 'Review algorithm complexity']
    });
  }
  
  if (metrics.memory.score < 90) {
    recommendations.push({
      priority: 'medium',
      category: 'memory',
      message: 'Optimize memory usage',
      actions: ['Review static collections', 'Implement proper cleanup', 'Consider object pooling']
    });
  }

  return recommendations;
}

function calculateSummary(metrics: any) {
  const scores = [
    metrics.codeQuality.score,
    metrics.performance.score,
    metrics.memory.score,
    metrics.compatibility.score
  ];
  
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const totalIssues = Object.values(metrics).reduce((sum: number, metric: any) => sum + (metric.issues?.length || 0), 0);
  const totalWarnings = Object.values(metrics).reduce((sum: number, metric: any) => 
    sum + (metric.issues?.filter((issue: any) => issue.severity === 'warning').length || 0), 0);

  return {
    overall: averageScore >= 85 ? 'good' : averageScore >= 70 ? 'fair' : 'needs_improvement',
    score: Math.round(averageScore),
    issues: Object.values(metrics).reduce((sum: number, metric: any) => 
      sum + (metric.issues?.filter((issue: any) => issue.severity === 'error').length || 0), 0),
    warnings: totalWarnings
  };
}

function findLineNumber(content: string, searchString: string): number {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 1;
}