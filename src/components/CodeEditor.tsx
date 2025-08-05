import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Zap, FileCode, Download } from "lucide-react";

export function CodeEditor() {
  console.log("💻 CodeEditor: Component loaded");
  const sampleCode = `@Mod("examplemod")
public class ExampleMod {
    public static final String MODID = "examplemod";
    
    public ExampleMod() {
        // Register the setup method for modloading
        FMLJavaModLoadingContext.get().getModEventBus()
            .addListener(this::setup);
    }
    
    private void setup(final FMLCommonSetupEvent event) {
        // Pre-init code here
        LOGGER.info("Hello from ExampleMod!");
    }
}`;

  return (
    <Card className="h-full bg-gradient-code border-code-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            ExampleMod.java
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">
              Forge
            </Badge>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
              Modified
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="bg-editor-bg rounded-b-lg overflow-hidden">
          <div className="bg-code-bg border-b border-code-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <div className="w-3 h-3 bg-tier-junior rounded-full"></div>
                <div className="w-3 h-3 bg-accent rounded-full"></div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                src/main/java/com/example/ExampleMod.java
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="code" 
                size="sm"
                onClick={() => {
                  console.log("💻 CodeEditor: AI Assist requested");
                  // TODO: Implement AI assistance
                }}
              >
                <Zap className="w-3 h-3" />
                AI Assist
              </Button>
              <Button 
                variant="code" 
                size="sm"
                onClick={() => {
                  console.log("💻 CodeEditor: Save requested");
                  // TODO: Implement save functionality
                }}
              >
                <Save className="w-3 h-3" />
                Save
              </Button>
            </div>
          </div>
          
          <div className="p-4 font-mono text-sm overflow-x-auto">
            <div className="flex">
              <div className="text-muted-foreground text-right mr-4 select-none space-y-0 leading-6">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="flex-1 leading-6">
                <code className="text-foreground">
                  <span className="text-purple-400">@Mod</span>
                  <span className="text-foreground">(</span>
                  <span className="text-green-400">&quot;examplemod&quot;</span>
                  <span className="text-foreground">)</span>
                  {"\n"}
                  <span className="text-blue-400">public class</span>
                  <span className="text-yellow-400"> ExampleMod</span>
                  <span className="text-foreground"> {"{"}</span>
                  {"\n"}
                  <span className="text-foreground">    </span>
                  <span className="text-blue-400">public static final</span>
                  <span className="text-yellow-400"> String</span>
                  <span className="text-foreground"> MODID = </span>
                  <span className="text-green-400">&quot;examplemod&quot;</span>
                  <span className="text-foreground">;</span>
                  {"\n\n"}
                  <span className="text-foreground">    </span>
                  <span className="text-blue-400">public</span>
                  <span className="text-yellow-400"> ExampleMod</span>
                  <span className="text-foreground">() {"{"}</span>
                  {"\n"}
                  <span className="text-foreground">        </span>
                  <span className="text-gray-400">// Register the setup method for modloading</span>
                  {"\n"}
                  <span className="text-foreground">        FMLJavaModLoadingContext.</span>
                  <span className="text-cyan-400">get</span>
                  <span className="text-foreground">().</span>
                  <span className="text-cyan-400">getModEventBus</span>
                  <span className="text-foreground">()</span>
                  {"\n"}
                  <span className="text-foreground">            .</span>
                  <span className="text-cyan-400">addListener</span>
                  <span className="text-foreground">(</span>
                  <span className="text-blue-400">this</span>
                  <span className="text-foreground">::setup);</span>
                  {"\n"}
                  <span className="text-foreground">    {"}"}</span>
                  {"\n\n"}
                  <span className="text-foreground">    </span>
                  <span className="text-blue-400">private void</span>
                  <span className="text-yellow-400"> setup</span>
                  <span className="text-foreground">(</span>
                  <span className="text-blue-400">final</span>
                  <span className="text-yellow-400"> FMLCommonSetupEvent</span>
                  <span className="text-foreground"> event) {"{"}</span>
                  {"\n"}
                  <span className="text-foreground">        </span>
                  <span className="text-gray-400">// Pre-init code here</span>
                  {"\n"}
                  <span className="text-foreground">        LOGGER.</span>
                  <span className="text-cyan-400">info</span>
                  <span className="text-foreground">(</span>
                  <span className="text-green-400">&quot;Hello from ExampleMod!&quot;</span>
                  <span className="text-foreground">);</span>
                  {"\n"}
                  <span className="text-foreground">    {"}"}</span>
                  {"\n"}
                  <span className="text-foreground">{"}"}</span>
                </code>
              </pre>
            </div>
          </div>
          
          <div className="bg-code-bg border-t border-code-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">Java • UTF-8 • LF</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-xs text-accent">Ready</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="code" 
                size="sm"
                onClick={() => {
                  console.log("💻 CodeEditor: Build & Test requested");
                  // TODO: Implement build & test
                }}
              >
                <Play className="w-3 h-3" />
                Build & Test
              </Button>
              <Button 
                variant="code" 
                size="sm"
                onClick={() => {
                  console.log("💻 CodeEditor: Export requested");
                  // TODO: Implement export
                }}
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}