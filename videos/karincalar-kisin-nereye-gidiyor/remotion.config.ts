import { Config } from "@remotion/cli/config";

// Türkçe belgesel shorts — 1080x1920, 30fps.
Config.setVideoImageFormat("jpeg");
Config.setChromiumOpenGlRenderer("swangle");
// Headless ortam: chromimum ekstra bayrakları shell'de uygulanır.
Config.setConcurrency(2);
