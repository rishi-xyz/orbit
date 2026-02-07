"use client";

import { useEffect, useRef } from "react";
import {
    createChart,
    CandlestickData,
    IChartApi,
    ISeriesApi,
} from "lightweight-charts";

export default function CandleChart() {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        /* -------------------------------
           Create Chart
        -------------------------------- */
        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 420,
            layout: {
                background: { color: "#ffffff" },
                textColor: "#111827",
            },
            grid: {
                vertLines: { color: "#e5e7eb" },
                horzLines: { color: "#e5e7eb" },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: "#d1d5db",
            },
            rightPriceScale: {
                borderColor: "#d1d5db",
            },
            crosshair: {
                mode: 1,
            },
        });

        chartRef.current = chart;

        /* -------------------------------
           Candlestick Series
        -------------------------------- */
        const candleSeries = chart.addCandlestickSeries({
            upColor: "#22c55e",
            downColor: "#ef4444",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
            borderVisible: false,
        });

        seriesRef.current = candleSeries;

        /* -------------------------------
           Fetch Stellar (XLM) OHLC Data
           CoinGecko → XLM / USD
        -------------------------------- */
        async function fetchXLMData() {
            try {
                const response = await fetch(
                    "https://api.coingecko.com/api/v3/coins/stellar/ohlc?vs_currency=usd&days=7"
                );

                const raw = await response.json();

                /**
                 * CoinGecko OHLC format:
                 * [timestamp, open, high, low, close]
                 */
                const formatted: CandlestickData[] = raw.map(
                    (candle: number[]) => ({
                        time: Math.floor(candle[0] / 1000),
                        open: candle[1],
                        high: candle[2],
                        low: candle[3],
                        close: candle[4],
                    })
                );

                candleSeries.setData(formatted);
                chart.timeScale().fitContent();
            } catch (error) {
                console.error("Error fetching XLM OHLC data:", error);
            }
        }

        fetchXLMData();

        /* -------------------------------
           Resize Handling
        -------------------------------- */
        const handleResize = () => {
            if (!containerRef.current || !chartRef.current) return;

            chartRef.current.applyOptions({
                width: containerRef.current.clientWidth,
            });
        };

        window.addEventListener("resize", handleResize);

        /* -------------------------------
           Cleanup
        -------------------------------- */
        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "420px",
            }}
        />
    );
}
