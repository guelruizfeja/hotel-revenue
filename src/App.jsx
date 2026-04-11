import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { supabase } from "./supabase";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const LOGO_B64 = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAFDAfUDASIAAhEBAxEB/8QAHAABAQACAwEBAAAAAAAAAAAAAAEDBwQGCAIF/8QAVRAAAQMCAgQIBwkMCAUFAAAAAAECAwQFBhEHEhMhMTM0U3KBkbEIFCJBUXGSFRcyN1RhdJPTIzZCUlVzoaKkstHSJDVig7PBwsMWJUNFgmNldZTw/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAEDBAIFBv/EADURAQABAwIDBQYFBAMBAAAAAAABAgMEETEFIUESUWFxsRMVkcHR8AYUMoGhIiMz8TVSVEL/2gAMAwEAAhEDEQA/APXVZyl3V3GNDJWcpf1dxjQsjZRVuAAlwAAAAAAADoAAAAAAAAAAAAAD6Pk+kAAAAAAAAAAAAAAAAAFIUAAAAAAAAAAAAAAAAAAAmAABIAAKhSFCJAAEAAAAADnRcW31IBFxbfUgKl8bOBWcpf1dxjQyVnKX9XcYkLI2U1bqACXAAAAAAAAOgAAAAAAAAAAAAAPpD5KgFAAAAAAAAAAAAAAAAKhCoAAAAAAAAAAAAAAAAAAAIAAHQAABUIUIUABAAAAAA50XFt9SARcW31ICpfGzgVnKXdXcYkMtZyl3V3GJCyNlNW6gAlwAAAAAAACYAAEgAAAAAAAAAAFQhUAoAAAAAAAAAAAAAAABUIEAoAAAAAAAAAAAAAAAAAAAAJAAEgAAqFPkqBGigAIAABzouLb6kAi4tvqQFS+NnArOUu6u4xIZazlDuruMRZGymrdQAS4AAAAAAABMAACQAAAAAAAAAACoQqAUAAAAAAAAAAAAAAAAAAUBAAAAAAAAAAAAAAAAAAAATAAAkBSAAABRmQBC5lzPkA0foRcW31IBFxTOigKl8OBWcof1dxiMtZyl/V3GIsjZRO6gICXAAAAAAAAJgAASAAAAAAAAAAAAAPpARCgAAAAAAAAAAAAAAAAVAQoAAAAAAAAAAAAAAAAAAAAAE6gACQAAAAAAKBz4uKZ0UAi4pnRQFS6HArOUv6u4xGWs5S/q7jEWRsondUBEKS5AAEAAAAAJAAEgAAAAAAAAAAAACoU+T6AAAAAAAAAAAAAAAAAFQgQCgAAAAAAAAAAAAAAAAAAAAAAAAAJAAEgAA/Qi4pnRQCLimdFAVLocCs5S7q7jEZazlLuruMRZGyidxCkKS5kAAQAAAAAAADoAAAAAAAAAAAAACoQqAUAAAAAAAAAAAAAAAAAAVAQoAAAAAAAAAAAAUgApAAAAAAAAABSAAAADV+hFxTOigEXFM6KAqXw4FZyh/V3GIy1nKX9XcYiyNlM7hUIEJcyoACAAAAAAAAdQAAAAAAAAAAAAAAAA+gRCgAAAAAAAAAAAAAAAACoQAUBCgQFIAAAAAAAAAAAAAAUgAAAAAAAAAH6EXFM6KARcUzooCpfGzgVnKX9XcYjLWcpd1dxiLI2UzuBACUKAgDkAAAAAADSOJNLmJLbiK526CitLoqWrlgYr4pFcrWvVqKuT0TPJDXiYV3LmabfRlys21iRFVzq3cDQPv04p+QWb6mX7Qvv04p/J9m+pl+0N3uHL7o+LF7+xO+fg36Dh2OoqKuy0NXVxJFUzU0ck0aNVuo9WorkyXemSqu5TVukLSpdbHiuqtNppbdNBTarHPnY9zlflm5Nzk3JnlwcKKYMbCu5NybdveG7JzbWNbi5c2lt4GvtEePKzF01fS3OGkhqadrZI0p2uajmLmi5o5y8C5dpsEryMevHuTbr3hZj5FGRbi5b2kBrbSJpTp8PXJ9ptdIytrIt0z5HKkca/i7t7l9O9Mu3Lpa6asU57rfZsvzMv2hus8Hyr1EVxTynvlivcYxbNc0TVzjuhv0Ggk00YqVURLfZlVeBEhl+0O4aSsf33DEVmWmo6FZa2l2s7aiN/kP8AJzRERyZcK8OYr4Pk0V00TprVrpz7ijjGNXRVXEzpTpry72zQaB9+nFPyCzfUy/aD36cU/ILN9TL9oW+4cvuj4qff2J3z8G/0Kah0c6S8R4lxdSWmqoLc2mkbI6Z8EMiOYjWKqLmr1RE1kam9POfOkPShf8O4wrrPRUdskp6fZ6jpo3q9daNrlzVHonC5fMUe6cj23seXa0136a6L/e2P7H23Ps66bddNW4AaA9+rFPyCzfUy/aGak02YgbMi1dqtksWe9sSSRuXrVzu4ungWZHSPipjj2HPWfg3yD8jCGIaDE9kiutArkY5VZJG74Ub04Wr2p1KhrDG2lXENjxXcLTSUdrfBTS6jHSxSK5UyRd6o9E8/oMePgXr9ybVMc431bMjPs2LdN2qeU7aNzA0B79WKfkFm+pl+0Hv1Yp+QWb6mX7Q2+4cvuj4sXv7E75+Df4NQ4t0l4ostvsdS2225q3ChSeRJoZNz9Zc0b5aZJlqrvz4TvGjTEkmKcKQ3SoZDHUpI+KdkSKjGuRd2WaqvwVavD5zHewL1m17WrbXT7+DbZ4hZvXZtU76a/fxdmANIXzTBiCLENXQ2qhtc1OypdDTq+KRz3ojskXc9E3+rznOJhXcqZi30dZebaxIibnVu8HQ9LmMrphCkt0tugo5XVL3tkSoY5yJqomWWq5PSa89+rFPyCzfUy/aF+PwnIyLcXKIjSfFnyOLY+Pcm3XM6x4N/g0B79WKfkFm+pl+0O/6IcZ3nF/ui+50lJDFTbNI308b2o5y62aKrnLnlknaTkcJyMe3NyvTSPEx+L42Rci3RrrPg2AVDRd20xYkorzV0jaC0vhgqHxpnHJrK1rlTh18s8k9Buex3KmvFopbpRv1oKmNJG+lM+FF+dFzRfnQoycC9jUxVcjlK7Fz7OVVVTbnnDmg6BpgxrdcHtta2ynopvG1l2njDHOy1dTLLVcn4yn6+jDEVbijCrLrcIqeKZ0z41bA1yNyTg4VVf0nNWHdpsRkT+mfv5O6cy1VfnHj9UffzdoBpjGelfEVmxXcLTS0VqfBTTbNjpIpFcqbuFUeifoNzjIw7uPTTVXtVt9/uY+ZayKqqaN6d/v8AYB1bSjiOtwthZbpb4qeWZJ2R6s7XK3Jc8+BUXzek/L0P40umMIrm65wUcK0rokZ4uxzc9bWzz1nL+Kgpw7tViciP0wVZlqm/GPP6pd9Bq3StpFveFMSx2y3UtulhdSsmV08b3OzVzk8z0TLcnmOpe/Xir8n2X6mX7Q1WeD5N6iLlMRpPiyXuM41m5NuqZ1jwb/BoD368Vfk+y/Uy/aG19GGILlibC7brdKaGCV8z2MSFjmtcxMslTWVc9+aZ5+YryuGX8Wjt3NNPNZi8UsZVfYt66+TtAAPPeiAAAAAABQIUgA/Qi4pnRQCLimdFAVL42cCs5Q/q7jEZazlL+ruMRZGymdwAEoVARChEgACAAADy3f0R2lG4NciKi3qRFRU4fu6nqQ8qYundTaQrxUsRFdFdp3oi8CqkrlPofw9GtdyI7nz34gnSi3M970/7k2r8m0X1Df4Fba7Y1yObbqNHIuaKkDc0/QaT9+y//km2dj/5jvmiXGtfjBtyWupKan8UWJGbHW362vnnmq/ioYsjhuXj25uV7R4t2PxLEyLkW7e8+DuN3robZaqu41C/cqaF0r9/CjUzyPNeBLS7GePEiuCueyodLU1bmrkvnXPrcqJ1m2PCAvHiGDmW2N+UtxmRip59mzJzv06qdZ+J4N1p1YLpe3t+G5tLEvzJ5T+9nYbcDXFwLmR1q5R6ffkxZ+mVn28fpTzn19PV0jRvXS4Y0k00VUuoiVDqKpTPcma6u/5kciL1Hpg846cbWtsx9PURorY62NtSxU8zvgu69Zqr1m9cD3dL7hO3XTWRXzQptfzieS/9ZFI4zTF63ayo6xpPr9U8Fqmzcu4tX/zOsen0eb7vHFUaRauKudlDJd3tncq5ZNWZUcufqzPTFNY7LTQMhgtNDHG1MmtSBv8AA1lpO0WVtzu896w++Fz6h2vPSyO1FV/nc1V3b+FUXLfnvOjeKaR8LfAjvdHEzmnOfEns5tNd+mjiNqj2V2KZiNpZLFVzht2v2tqaomd4ejGWy2se17LfSNc1c0ckLUVF9PAZKmjpKpWrU0sE6t4FkjR2XaaHw3pfxDRVkbL22O40ueUmUaRyonpRUyTNPQqb/SnCb5oaqCtooaymkSSCeNskbk/CaqZovYeHmYV/EmPaddph7uFm4+ZE+z6bxLoGnGgoafR/USQUVNE9J4k1mRNavwvSiHWPBxpKWqfffGaaGfVSn1doxHZZ7TgzO4aefi7qPz8X7x1XwaPh3/1U/wDunp2ap903J16/OHl3qY972406fKW36ajo6VyupqWCBXJkqxxo3PsPN+mz4zrv/c/4MZ6XPNGmz4zrv/c/4MZx+HpmcqrX/rPrCz8QxEYtOn/aPSXoGzWq1utFG51to1VadiqqwN3+SnzGvfCDslqgwzSXOmoaeCqbVtiV8UaNVzFa5VRcuHe1P/yn4VHpoulNSQ07bLRuSKNrEVZHb8kyOuY9x/dsYU8FFUU0FNTRSbRIos1V78lRFVV9CKu75y/C4ZmWsmm5VyiJ72fN4nh3caq3TzmY7mwPBre5bLd41XyUqGKifOrVz7kNbaV/jEvX0j/ShuHQRh+tsuFZqi4QugmrpklbE9MnNYiZNzTzKu9cvRkae0r/ABiXr6R/pQ04NdNfE700zy0+jNnUVUcMsxVHPX6vSrLTatRP+WUXBzDf4FS02pP+20X1Df4GgEuelvJMo8TZfQ5P5TvOhyrxtUXysbidl3SmSmzi8cgcxuvrJwKqJvyzPIyOG3LNubk3YnTul6+PxO3euRbi1Ma98OV4Qdp8dwdHcmNzkt86OVcv+m/yXfp1F6jr3g23TVqbrZXu3Pa2piT50XVd3s7Dbt+t8d2stbbJctSqgfEqr5s0yRerhPN2jGuksGke3pUZx/0haSdq+bWzZv8AU5UXqNWBP5nh92x1p5x6+sMufH5biFq/0q5T6ekvQ+NLp7i4Uudz1tV8FO5Y1/tqmTf1lQ896HbT7r6QKBr260VKq1UnqZvb+sre02Z4RV08WwtSWtjsn1tRrOT0sjTNf1lZ2HC8G+07O23K9yN8qeRKeJV/FambsvmVVT2Rhz+W4bcu9auUen1MyPzXErdnpTzn1+j58Jb+r7J+dl7mn6GgKhoanA0klRR08z/HZE1pIkcuWqzzqh+f4S39X2X87L3NNd4VrMeU9sVmG2XlaLaKq+KU7ns18kz3oi7+A0Y+PVkcMpopqinn185Z8jIpx+KV11UzVyjlHlD0r7k2v8m0X1Df4HJp4IKePZ08McLM89VjUamfqQ0DaLlpVddaRtTHiPYLOxJNejejdXWTPPyeDI9BHh5uLXjTEVVxVr3S9zCy6MmJmmiadO+Hku9UtRW4tuNNSxLLM+rn1WN4Vyc5Vy6kNk+D1ifZVE2F6uTyJc5qPNeB34bOtPK6nek6bZJthpep5P8A3vVX1LNl/mfoaUrJUYMx1Hc7ZnDTzyeNUjmpuY9FzczqXzehyIfV5MUZFMYtW9VOsecffq+TxZrx6pyqdqatJ8p+/R2nwmeLsHrqP9o7LoA+LyP6VL3odJ003aDEeEMMX2myRsizNezP4D1Rms3qVqnddAPxexfSZe9DyMimaOFU01bxVPrL2MeqK+LV1U7TTE/xDTelH4xrz9KXuQ9SnlrSj8Y15+lL3IepTnjX+DH8vlS64L/nyPP51Ne+ED8XzvpcX+Z1/wAGbk9+6cHdIdg8IH4vnfS4v8zr/gzcnv3Tg7pBa/4ivz+cF3/mKPL5S674RP3+QfQI/wB95tnR1bLbLgSyyS2+ke91HGrnOhaqquXnXI1N4RP39wfQI/33n5louGk2O10zLXHiBaFsaJBsaR7manm1VRu9DbXi1ZOBZppqinTvYqMqnGz71VVM1a9z0X7k2r8mUX1Df4HLiYyONscbGsY1MmtamSInoRDS+jSu0izY2t8d+ZfUty7TbLU0z2R8W7VzVWoieVl15G6T57Nx6seuKKqoq5a8n0WFkU5FE100zTz05gAMbYAAAAUAQACggA/Qi4pnRQCLimdFAVL42cCs5S/q7jEZazlLuruMRZGymdwAEoCoQIESoACAAADy3iBrX6ULgx7Uc116kRUVM0VNup6kNFXXRxiyox3V3WKhiWkkub6hrvGGIqsWVXIuWefB5j3OCXrdqq5NdURrHV4fG7Ny7TbiimZ0no3F/wAPWD8h2z/6jP4HKobfQUGv4jQ01Lr5a+xiazWy4M8k38KnJB403K5jSZe3TboidYh51073j3Sxw+jjfnDb40gTLg118py9qon/AImK0Yb0nU1BE21svFNSvTaMZDXbNvlb89VHplmfoRaMMXV+Jm1V1pIkp6is2lVJ4wxV1XPzcuSLnnlmb/RERERERETciIfS5PEbeJZt2bPZr0jn1++r5jG4bcy71y9e7VGs8un30eYMW2HHMFElxxLFcZYIVRjZamp2uprLwJ5Sqmamw/BxvG0t9xsUj/KhelTCir+C7c7qRUb7RsXGlp93cK3G1IiK+eBUjz4Nom9n6yIau0V4Fxbh7GlLcK2ljho9SSOdWzscqtVi5Jki5/CRpxVnW8zBrouaU1RtG3jy/mFlODcws6iu3rVTO87+HP8AiW6Aefrro4x5PdKqaGD7nJM9zP6Y1NyuVU/COMujPSB8n/bWfzGSOF48xr+Yp+/3a54pkxOn5er+foy+EDJQvxyzxR0TpW0jG1OplufrO3O/taur1ZG3tFKuXR3ZVfnn4v5/RrLl+g1Xh/Q5f6mrjdeZqeipUdnIjJNpK5PQmW7rVepTetDSwUVFBR0saRwQRtjjYnA1qJkiFnFL9mMe3j26u12eqvhdi9ORcyblPZ7XR0nTz8XdR+fi/eOq+DP8O/8Aqp/9073pXstwv+DprbbImy1LpY3I1z0amSLmu9T8HQlhO94YddlvFMyHxlIdlqytfnq6+fAu74SHFm9bjhdduao7Uzt13h3es3J4pRcimezEb9NpbJPNGmz4zrv/AHP+DGelzSek3R9ii+Y4uF0t1FFJSz7LUcs7GqurExq7lXPhRSOBXrdrImq5VERp184dcds3LuPTTbpmZ16eUtkWrCmF5bRSrJhy0Oc+nZrO8TjzVVama55Z5/OaEv8ARV2ANIH9HXN1JMk9K56ZpJGvBn1ZtX50U9L2yJ8FupoZEyfHCxrkz86IiKdK0x4MnxTbKaotkbHXKlfk1HORu0jdwtzXduXJUz+f0jhuf7O/NF2daKuU6o4nge0sRXajSunnGjtuGbzSX+x0t2onZxTsz1VXex3ArV+dFzQ83aV/jEvX0j/ShtjQthvFOGZK+lvETIqGZqPjakzX5ScCqmS7s04fUh1XH+jnFl3xjc7lQ0MUlNPNrRuWoY1VTJE4FXM1cNmxi5lyO3HZ05Tr4wy8Si/l4duexPa15xp4S3oz4DfUU85+9npB+T/trP5h72WkH5P+2s/mM3uvG/8ART/H1afeuT/56v5+j0Yea9NFrdZ9IVVNFmxlXq1cSp5ld8Lr1kcvWb6wPQ1ltwlbaC4Jq1UECMlTWR2/1pwnVNNWDbhielt89ohZLV0z3Mc1z0ZnG5M8819Conapxwq/Ti5cxVV/TOsa9PCVnFsevKxImmn+qNJ06+MNVaV8TsxPd6Coieixw0MSOROBJHJrPTqVUb/4m/cAWn3DwdbLardWSOBHSp/6jvKd+lVQ05hbRViaPEVvlutDDHQxztfOqTsdm1q5qmSLnvyy6z0AXcXv2YtW8exOtMc+X35qOD2L03bmRfp0qnlz+/JqHwlv6vsn52XuafseDz94Un06T91h9abMLXnE9JbI7PTsmdTySOk1pWsyRUblwr8ymtY9F+PY26sdI1jeHJtYxE/eLrEWL/D6bNdyKZ115+c+Ki/N+xxGq9RbmqNNOXlHg9HA85+9npB+T/trP5jYehfC+IsOzXR19j1EnbEkX3dJOBXZ8CrlwoYMjh9i1bmum9FUx0j/AG9HG4hfu3IoqszTE9Z/01JRfGtB/wDON/xzfmk7DTcUYUqKNjUWsi+7Urv7aJwepUzTrRfMaxpdHGLGY9iuzqGJKRt0SoV/jDM9Ta62eWefB5jexq4rl0+0tV2aomaY6MnCcSr2d23epmIqnq8gPr6xlqdZ5FygbU7fUci5skRqtXL0Zpln0UN/6Afi9i+ky96HVtJ+jG73DFEtzw9TRSQVabSZiytZqS/hZZrvReH1qp3vRLZLjh/B7LddImxVKTverWvRyZKqZb0NPFMyxkYcTRMazMTp1ZuFYd/HzJiuJ0iJjXo0TpS3aRLyq/KVX9CHqKCWOeFk0L2yRyNRzHNXNHIqZoqGp9LmjWvvV3dfbDs5Z5mtSop3vRiuVEyRzVXdwImaLlwZ+c6fS4H0pUsKQUsFdBE3gZHc42tTqSQi/Tj5+Pa/uxTNMac/2+ibFWRgZF3+1NUVTrrH7/VsXwhZomYDbE+RqPkrI9Rue92SOVT8PwZkXxa+r5teDukOpVOjnSNcZ2LX0U0ypuSSor436qe2q5eo3PozwkzCGH/EnTNnq5n7Wokankq7LJGt+ZP4r58irJqsY2BOPTciqZnp5x9FuNTfyeIRkVW5piI6+U/VqPwifv8AIPoEf77zcejX7wLH9Cj7joWmPA2I8SYrir7TSRzU7aRkSudM1q6yOcqpkq/Oh1BujDH7Wo1tKjUTgRK1iIn6xbVTj5WFat1XYpmPvvVU1ZGLm3blNqaon77no0HnP3stIPyf9tZ/Mbd0SWW7WHCjqG9M1Klal78tqj/JVG5b0X5lPKysGzYt9qi9FU90f7eriZ16/c7NdmaY75/07eUgPNemAAAAAAAAAAD9CLimdFAIuKZ0UBUvjZwKzlL+ruMRlrOUv6u4xFkbKZ3AASgAAFAQBAAAgAAAABIAAkAAAAAAAAAAAAAAABUKRCgAAAAAAAAAAAAAAAAAAAAAAZgAXMp8lzAAAAAAAKQAAAAAAAFA58XFM6KARcUzooCpfGzgVnKXdXcYjLWcpf1dxiLI2UzuAAlAAACFIVAiQABAAAAAAAAJgAASAAAAAAAAAAAAABUIAPoERSgAAAAAAAAAAAAAAAAAAAAAAAABmABcwQAUEzLmAAAAoIBSFAHPi4pnRQCLimdFAVL42cCs5S/q7jEZazlLuruMRZGymdwAEoAAACAAUBAHIAAAAAAAJAAEgAAAAAAAAAAAAAAABUUgA+gRFKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzLmQAXMZkAH6MXFM6KAQ8UzooCpfGzgVnKX9XcYjLWcpf1dxiLI2UTvIACQAAAAAEKQqBEgACAAAAAAAATAAAkAAAAAAAAAAAAAAAAKikAH0CIpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/Rh4pnRQCHimdFAVL42cCs5S/q7jEZazlL+ruMRZGyircABIAAAAAAAAoIhQgAAQAAAAAAADoAAAAAAAAAAAAAAAAAAAqKQAfQJmUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9GHimdFAIeKZ0UBUvjZwKzlLuruMRlrOUv6u4xFkbKKt5AASiAABIAAAAAFQgQCgAOQAAAAAAAAAB0AAAAAAAAAAAAAAAAAAAXMgA+gfJUUCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAP0YeKZ0UAh4pnRQFS+NnArOUv6u4xGWs5Q/q7jEWRsoq3kABLkAAdAIUAAAAAAIUhUCJAAEAAAAAAAAkAASAAAAAAAAAAAAAAAAAAAAALmXM+QB9AmZcwAAAAAAAAAAAAAAAAAAAAAAAAP0YeKZ0UAh4pnRQFS+NnArOUv6u4xGWs5S7q7jEWRsoq3kABLkAASAAJAAAAAAAAVARChAAAgAAAAAAAEgACQAAAAAAAAAAAAAAAAAAAAAAAFzKfIA+gTMZgUAAAAAAAAAAAAAAAAAAfow8UzooBDxTOigKl8bOBWcpf1dxiORXMVJdfLc445ZGyircABLkAAAABMAACQhQAAAAIABQRChAAAgAAAAAAAEgACQAAAAAAAAAAAAAAAAAAAAAAAAAAC5kAFzKfIA+gTMZgUEzKAAAAAAACtarnIiJmqgfoQ8UzooCsTVY1voTIFTRCqiKmSpmh8bKLm2eygADZRc2z2UGyi5tnsoAEaQbKLm2eyg2UXNs9lAAaQbKLm2eyg2UXNs9lAAaQbKLm2eyg2UXNs9lAAaGyi5tnsoNlFzbPZQAGhsoubZ7KDZRc2z2UABobKLm2eyg2UXNs9lAAaGyi5tnsoXZR82zsABpBso+bZ2DZR82zsABpBso+bZ2DZR82zsABpBso+bZ2DZR82zsABpBso+bZ2DZR82zsABpBso+bZ2DZR82zsABpBso+bZ2DZR82zsABobKPm2dg2UfNs7AAaGyj5tnYNlHzbOwAGhso+bZ2DZR82zsABobKPm2dg2UfNs7AAaGyj5tnYNlHzbOwAGhso+bZ2DZR82zsABobKPm2dg2UfNs7AAaGyj5tnYNlHzbOwAGhso+bZ2DZR82zsABobKPm2dg2UfNs7AAaGyj5tnYNlHzbOwAGhso+bZ2DZR82zsABobKPm2dg2UfNs7AAaGzj5tnYNnHzbewAGhs4+bb2DZx823sABobOPm29hWta34LUT1IAE6KAAP/9k=";
const C = {
  bg: "#FDFDFD", bgCard: "#FFFFFF", bgDeep: "#0A2540",
  accent: "#004B87", accentLight: "#E8F0F9", accentDark: "#003366",
  text: "#1A1A1A", textMid: "#555555", textLight: "#888888",
  border: "#E0E0E0", green: "#009F4D", greenLight: "#E6F7EE",
  red: "#D32F2F", redLight: "#FDECEA", blue: "#004B87",
};

const LangContext = createContext("es");
const useT = () => { const lang = useContext(LangContext); return (k) => (TRANSLATIONS[lang] || TRANSLATIONS.es)[k] ?? k; };
const TRANSLATIONS = {
  es: {
    // Nav & topbar
    nav_dashboard:"Dashboard", nav_pickup:"Pickup", nav_budget:"Presupuesto", nav_grupos:"Grupos/Eventos",
    importar:"Importar", mi_perfil:"Mi perfil", cerrar_sesion:"Cerrar sesión",
    suscripcion:"Suscripción", extranets:"Extranets", informe_mensual:"Informe mensual",
    conectado_como:"Conectado como", cargando:"Cargando...",
    // Onboarding
    ob_paso:"Paso", ob_de:"de", ob_omitir:"Omitir", ob_siguiente:"Siguiente →", ob_empezar:"¡Empezar!",
    ob0_title:"Importa tus datos", ob0_text:"Descarga la plantilla Excel, rellénala con tus datos de producción y súbela aquí. En segundos tendrás el dashboard activo.",
    ob1_title:"Dashboard", ob1_text:"Visualiza tus KPIs principales: RevPAR, ADR y ocupación comparados con el año anterior.",
    ob2_title:"Pickup", ob2_text:"Analiza el ritmo de nuevas reservas día a día y detecta tendencias de cara al mes.",
    ob3_title:"Presupuesto", ob3_text:"Compara producción real vs objetivo mensual y proyecta el cierre del año.",
    ob4_title:"Grupos/Eventos", ob4_text:"Gestiona grupos y eventos: confirmados, tentativos y pipeline de negocio.",
    // KPIs
    kpi_ocupacion:"Ocupación", kpi_adr:"ADR", kpi_revpar:"RevPAR", kpi_trevpar:"TRevPAR",
    kpi_rev_diario:"Revenue Diario", kpi_rev_mensual:"Revenue Mensual", kpi_rev_hab:"Rev. Hab.", kpi_rev_total:"Rev. Total",
    sin_datos_prev:"Sin datos prev.", vs_mes_ant:"vs mes ant.", vs_anio_ant:"vs año ant.",
    // Empty & loading
    sin_datos:"Sin datos todavía", importa_excel:"Importa tu plantilla Excel para ver los datos aquí",
    cargando_datos:"Cargando datos...", cargando_pickup:"Cargando pickup...",
    // Months
    meses_full:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    meses_corto:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    dias_semana:["L","M","X","J","V","S","D"],
    dias_abrev:["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
    // Dashboard
    bienvenido:"Bienvenido", ocup_mensual:"Ocupación mensual", adr_ocupacion:"ADR & Ocupación",
    ultimos_12m:"Últimos 12 meses", sin_datos_mes:"Sin datos para este mes",
    adr_ocup_diaria:"ADR & Ocupación diaria", otb:"OTB",
    // Table headers
    th_anio:"Año", th_mes:"Mes", th_ocup:"Ocup.", th_adr:"ADR",
    th_revpar:"RevPAR", th_trevpar:"TRevPAR", th_rev_hab:"Rev. Hab.", th_rev_total:"Rev. Total",
    th_fecha:"Fecha", th_hab_ocup:"Hab. Ocup.", th_rev_day:"Rev. Total",
    th_ocup_media:"Ocupación media", th_adr_medio:"ADR medio", th_revpar_medio:"RevPAR medio",
    th_rev_hab_total:"Rev. Hab. total", detalle_diario:"Detalle diario",
    dias_con_datos:"días con datos", total_mes:"TOTAL MES", volver:"← Volver",
    // Pickup
    reservas_ayer:"Reservas de ayer", reservas_captadas:"reservas captadas",
    no_reservas_ayer:"No hay reservas registradas para ayer",
    por_mes_llegada:"Por mes de llegada", por_canal:"Por canal", por_mes_afectado:"Por mes afectado",
    cancelaciones_ayer:"Cancelaciones de ayer", cancelaciones:"cancelaciones",
    sin_cancelaciones:"Sin cancelaciones ayer", cancel_abrev:"cancel.",
    duracion_media:"Duración media", noches_reserva:"Noches por reserva confirmada",
    noches_media:"noches media", precio_medio_reserva:"Precio medio reserva",
    revenue_medio:"Revenue medio por reserva confirmada", precio_medio:"precio medio",
    dia_pico:"Día pico", res_abrev:"res.",
    fechas_calientes:"Fechas Calientes", sin_futuras:"Sin reservas futuras",
    ventana_reserva:"Ventana de reserva", dias_label:"días",
    este_mes_label:"Este mes", anio_ant_abrev:"Año ant.", variacion_label:"Variación",
    demanda_debil:"↓ Señal de demanda débil", demanda_adelantada:"↑ Demanda adelantada",
    analisis_desplazamiento:"Análisis de Desplazamiento",
    contrib_grupo:"Contrib. grupo", coste_desplaz:"Coste desplaz.", valor_neto:"Valor neto",
    adr_transient_ref:"ADR transient ref.", occ_hist_ly:"Occ. hist. LY",
    adr_minimo_rentable:"ADR mínimo rentable", acepta_grupo:"✓ Aceptar", revisar_grupo:"⚠ Revisar",
    sin_datos_ly:"Sin datos LY — usando ppto.", fuente_ppto:"fuente: ppto.",
    // Budget
    rev_real_ytd:"Revenue Real YTD", forecast_cierre_anio:"Forecast Cierre Año",
    presupuesto_anio:"Presupuesto Año", detalle_mensual:"Detalle mensual",
    th_adr_ppto:"ADR Ppto.", th_adr_real:"ADR Real", th_desv_adr:"Desv. ADR",
    th_revpar_ppto:"RevPAR Ppto.", th_revpar_real:"RevPAR Real", th_desv_revpar:"Desv. RevPAR",
    th_rev_ppto:"Rev. Ppto.", th_rev_real:"Rev. Real", th_desv_rev:"Desv. Rev.",
    th_forecast:"Forecast Cierre", total_ytd:"TOTAL YTD", vs_ppto:"vs ppto",
    confianza:"confianza", real_badge:"✓ Real",
    // Grupos
    nuevo_evento:"+ Nuevo evento", sin_eventos:"Sin eventos", rev_estimado:"Revenue estimado",
    editar_evento:"Editar evento", nuevo_evento_title:"Nuevo evento",
    eliminar_grupo:"¿Eliminar este grupo?",
    vista_calendario:"Calendario", vista_lista:"Lista", vista_pipeline:"Pipeline", vista_tabla:"Tabla",
    rev_confirmado:"Revenue confirmado", rev_tentativo:"Revenue tentativo (50%)",
    pipeline_cotizacion:"Pipeline en cotización", cancelados_perdidos:"Cancelados / Perdidos",
    cat_corporativo:"Corporativo", cat_boda:"Boda / Social", cat_feria:"Feria / Congreso",
    cat_deportivo:"Deportivo", cat_otros:"Otros",
    estado_confirmado:"Confirmado", estado_tentativo:"Tentativo",
    estado_cotizacion:"En cotización", estado_cancelado:"Cancelado",
    form_nombre:"Nombre del evento *", form_categoria:"Categoría", form_estado:"Estado",
    form_fecha_entrada:"Fecha entrada *", form_fecha_salida:"Fecha salida *", form_fecha_confirmacion:"Fecha confirmación",
    form_habitaciones:"Habitaciones", form_adr:"ADR Grupo", form_fnb:"Revenue F&B",
    form_sala:"Revenue Sala", form_notas:"Notas", form_motivo:"Motivo de pérdida",
    form_guardar:"Guardar", form_cancelar:"Cancelar", form_eliminar:"Eliminar", guardando_btn:"Guardando...",
    noche:"noche", noches:"noches", hab_abrev:"hab.",
    // Importar
    importar_title:"Importar datos", importar_sub:"Sube tu plantilla Excel de FastRev",
    vaciar_datos:"Vaciar todos los datos importados", vaciar_confirm:"¿Vaciar todos los datos?",
    vaciar_desc:"Se eliminarán producción, pickup y presupuesto. Esta acción no se puede deshacer.",
    vaciando:"Vaciando...", si_vaciar:"Sí, vaciar todo",
    haz_clic:"Haz clic para seleccionar el archivo", formato_xlsx:"Formato .xlsx · Plantilla FastRev",
    importando_xlsx:"Al importar se reemplazarán los datos anteriores",
    importado_ok:"¡Datos importados correctamente!", ver_dashboard:"Ver dashboard",
    dias_produccion:"días de producción importados", reservas_pickup:"reservas de pickup importadas",
    meses_presupuesto:"meses de presupuesto importados",
    leyendo:"Leyendo archivo...", procesando:"Procesando hojas...",
    limpiando:"Limpiando datos anteriores...", guardando:"Guardando datos...",
    imp_datos_title:"Datos & Pickup", imp_datos_sub:"Producción diaria + reservas pickup",
    imp_ppto_title:"Presupuesto", imp_ppto_sub:"Sólo hoja 💰 Presupuesto",
    imp_ppto_ok:"Presupuesto actualizado",
    // Suscripción
    empieza_gratis:"Empieza gratis 30 días",
    acceso_completo:"Acceso completo a FastRev durante 30 días sin coste.",
    precio_sub:"Después, solo €49/mes + IVA. Cancela cuando quieras.",
    empezar_prueba:"Empezar prueba gratuita →", redirigiendo:"Redirigiendo...",
    feat_dashboard:"Dashboard con KPIs en tiempo real", feat_pickup:"Análisis de pickup y forecast",
    feat_presupuesto:"Presupuesto vs real mensual", feat_pdf:"Informes PDF mensuales",
    ver_pickup:"→ Ver Pickup", importar_datos:"→ Importar datos", ver_mas:"→ Ver más",
    prox_semana:"Próx. semana", prox_mes:"Próx. mes", anio_actual:"Año actual",
    otb_actual:"OTB Actual", anio_anterior:"Año Anterior",
    pace_title:"Pace — Próximos 6 meses", pace_sub:"OCC en cartera vs Presupuesto y Año Anterior",
    sin_datos_pickup:"Sin datos de pickup",
    budget_empty:"Importa tu plantilla Excel con los datos de la hoja 💰 Presupuesto para ver el análisis aquí",
    rev_total_label:"Revenue Total", ppto_abrev:"Ppto.", real_label:"Real",
    chart_rev:"Revenue Total — Ppto. vs Real vs Forecast",
    chart_adr:"ADR — Ppto. vs Real", chart_revpar:"RevPAR — Ppto. vs Real",
    // General
    generando:"Generando...", cancelar:"Cancelar", guardar:"Guardar", eliminar:"Eliminar",
    si:"Sí", no:"No", todos:"Todos",
  },
  en: {
    nav_dashboard:"Dashboard", nav_pickup:"Pickup", nav_budget:"Budget", nav_grupos:"Grupos/Eventos",
    importar:"Import", mi_perfil:"My profile", cerrar_sesion:"Log out",
    suscripcion:"Subscription", extranets:"Extranets", informe_mensual:"Monthly report",
    conectado_como:"Signed in as", cargando:"Loading...",
    ob_paso:"Step", ob_de:"of", ob_omitir:"Skip", ob_siguiente:"Next →", ob_empezar:"Get started!",
    ob0_title:"Import your data", ob0_text:"Download the Excel template, fill it with your production data and upload it here. Your dashboard will be ready in seconds.",
    ob1_title:"Dashboard", ob1_text:"View your main KPIs: RevPAR, ADR and occupancy compared to the previous year.",
    ob2_title:"Pickup", ob2_text:"Analyze the pace of new reservations day by day and detect trends for the month.",
    ob3_title:"Budget", ob3_text:"Compare real production vs monthly target and project year-end results.",
    ob4_title:"Grupos/Eventos", ob4_text:"Manage groups and events: confirmed, tentative and business pipeline.",
    kpi_ocupacion:"Occupancy", kpi_adr:"ADR", kpi_revpar:"RevPAR", kpi_trevpar:"TRevPAR",
    kpi_rev_diario:"Daily Revenue", kpi_rev_mensual:"Monthly Revenue", kpi_rev_hab:"Room Rev.", kpi_rev_total:"Total Rev.",
    sin_datos_prev:"No prev. data", vs_mes_ant:"vs prev. month", vs_anio_ant:"vs prev. year",
    sin_datos:"No data yet", importa_excel:"Import your Excel template to see your data here",
    cargando_datos:"Loading data...", cargando_pickup:"Loading pickup...",
    meses_full:["January","February","March","April","May","June","July","August","September","October","November","December"],
    meses_corto:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    dias_semana:["M","T","W","T","F","S","S"],
    dias_abrev:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    bienvenido:"Welcome", ocup_mensual:"Monthly Occupancy", adr_ocupacion:"ADR & Occupancy",
    ultimos_12m:"Last 12 months", sin_datos_mes:"No data for this month",
    adr_ocup_diaria:"Daily ADR & Occupancy", otb:"OTB",
    th_anio:"Year", th_mes:"Month", th_ocup:"Occup.", th_adr:"ADR",
    th_revpar:"RevPAR", th_trevpar:"TRevPAR", th_rev_hab:"Room Rev.", th_rev_total:"Total Rev.",
    th_fecha:"Date", th_hab_ocup:"Occ. Rooms", th_rev_day:"Total Rev.",
    th_ocup_media:"Avg Occupancy", th_adr_medio:"Avg ADR", th_revpar_medio:"Avg RevPAR",
    th_rev_hab_total:"Total Room Rev.", detalle_diario:"Daily detail",
    dias_con_datos:"days with data", total_mes:"MONTH TOTAL", volver:"← Back",
    reservas_ayer:"Yesterday's bookings", reservas_captadas:"bookings captured",
    no_reservas_ayer:"No bookings registered for yesterday",
    por_mes_llegada:"By arrival month", por_canal:"By channel", por_mes_afectado:"By affected month",
    cancelaciones_ayer:"Yesterday's cancellations", cancelaciones:"cancellations",
    sin_cancelaciones:"No cancellations yesterday", cancel_abrev:"cancel.",
    duracion_media:"Average stay", noches_reserva:"Nights per confirmed booking",
    noches_media:"avg nights", precio_medio_reserva:"Average booking price",
    revenue_medio:"Average revenue per confirmed booking", precio_medio:"avg price",
    dia_pico:"Peak day", res_abrev:"bkgs.",
    fechas_calientes:"Hot Dates", sin_futuras:"No future bookings",
    ventana_reserva:"Booking window", dias_label:"days",
    este_mes_label:"This month", anio_ant_abrev:"Prev. year", variacion_label:"Change",
    demanda_debil:"↓ Weaker demand signal", demanda_adelantada:"↑ Stronger demand",
    analisis_desplazamiento:"Displacement Analysis",
    contrib_grupo:"Group contrib.", coste_desplaz:"Displacement cost", valor_neto:"Net value",
    adr_transient_ref:"Transient ADR ref.", occ_hist_ly:"Hist. occ. LY",
    adr_minimo_rentable:"Min. profitable ADR", acepta_grupo:"✓ Accept", revisar_grupo:"⚠ Review",
    sin_datos_ly:"No LY data — using budget", fuente_ppto:"source: budget",
    rev_real_ytd:"Actual Revenue YTD", forecast_cierre_anio:"Year-End Forecast",
    presupuesto_anio:"Annual Budget", detalle_mensual:"Monthly detail",
    th_adr_ppto:"Budget ADR", th_adr_real:"Actual ADR", th_desv_adr:"ADR Dev.",
    th_revpar_ppto:"Budget RevPAR", th_revpar_real:"Actual RevPAR", th_desv_revpar:"RevPAR Dev.",
    th_rev_ppto:"Budget Rev.", th_rev_real:"Actual Rev.", th_desv_rev:"Rev. Dev.",
    th_forecast:"Closing Forecast", total_ytd:"TOTAL YTD", vs_ppto:"vs budget",
    confianza:"confidence", real_badge:"✓ Actual",
    nuevo_evento:"+ New event", sin_eventos:"No events", rev_estimado:"Estimated revenue",
    editar_evento:"Edit event", nuevo_evento_title:"New event",
    eliminar_grupo:"Delete this group?",
    vista_calendario:"Calendar", vista_lista:"List", vista_pipeline:"Pipeline", vista_tabla:"Table",
    rev_confirmado:"Confirmed revenue", rev_tentativo:"Tentative revenue (50%)",
    pipeline_cotizacion:"Quotation pipeline", cancelados_perdidos:"Cancelled / Lost",
    cat_corporativo:"Corporate", cat_boda:"Wedding / Social", cat_feria:"Trade Fair / Congress",
    cat_deportivo:"Sports", cat_otros:"Others",
    estado_confirmado:"Confirmed", estado_tentativo:"Tentative",
    estado_cotizacion:"In quotation", estado_cancelado:"Cancelled",
    form_nombre:"Event name *", form_categoria:"Category", form_estado:"Status",
    form_fecha_entrada:"Check-in date *", form_fecha_salida:"Check-out date *", form_fecha_confirmacion:"Confirmation date",
    form_habitaciones:"Rooms", form_adr:"Group ADR", form_fnb:"F&B Revenue",
    form_sala:"Meeting Room Revenue", form_notas:"Notes", form_motivo:"Reason for loss",
    form_guardar:"Save", form_cancelar:"Cancel", form_eliminar:"Delete", guardando_btn:"Saving...",
    noche:"night", noches:"nights", hab_abrev:"rms.",
    importar_title:"Import data", importar_sub:"Upload your FastRev Excel template",
    vaciar_datos:"Clear all imported data", vaciar_confirm:"Clear all data?",
    vaciar_desc:"Production, pickup and budget data will be deleted. This action cannot be undone.",
    vaciando:"Clearing...", si_vaciar:"Yes, clear all",
    haz_clic:"Click to select file", formato_xlsx:"Format .xlsx · FastRev template",
    importando_xlsx:"Importing will replace previous data",
    importado_ok:"Data imported successfully!", ver_dashboard:"View dashboard",
    dias_produccion:"production days imported", reservas_pickup:"pickup bookings imported",
    meses_presupuesto:"budget months imported",
    imp_datos_title:"Data & Pickup", imp_datos_sub:"Daily production + pickup bookings",
    imp_ppto_title:"Budget", imp_ppto_sub:"Only 💰 Budget sheet",
    imp_ppto_ok:"Budget updated",
    leyendo:"Reading file...", procesando:"Processing sheets...",
    limpiando:"Clearing previous data...", guardando:"Saving data...",
    empieza_gratis:"Start free for 30 days",
    acceso_completo:"Full access to FastRev for 30 days at no cost.",
    precio_sub:"Then just €49/month + VAT. Cancel anytime.",
    empezar_prueba:"Start free trial →", redirigiendo:"Redirecting...",
    feat_dashboard:"Real-time KPI dashboard", feat_pickup:"Pickup and forecast analysis",
    feat_presupuesto:"Budget vs actual monthly", feat_pdf:"Monthly PDF reports",
    ver_pickup:"→ View Pickup", importar_datos:"→ Import data", ver_mas:"→ See more",
    prox_semana:"Next week", prox_mes:"Next month", anio_actual:"Current year",
    otb_actual:"Current OTB", anio_anterior:"Previous Year",
    pace_title:"Pace — Next 6 months", pace_sub:"OCC pipeline vs Budget and Previous Year",
    sin_datos_pickup:"No pickup data",
    budget_empty:"Import your Excel template with the 💰 Budget sheet data to see the analysis here",
    rev_total_label:"Total Revenue", ppto_abrev:"Budget", real_label:"Actual",
    chart_rev:"Total Revenue — Budget vs Actual vs Forecast",
    chart_adr:"ADR — Budget vs Actual", chart_revpar:"RevPAR — Budget vs Actual",
    generando:"Generating...", cancelar:"Cancel", guardar:"Save", eliminar:"Delete",
    si:"Yes", no:"No", todos:"All",
  },
  fr: {
    nav_dashboard:"Dashboard", nav_pickup:"Pickup", nav_budget:"Budget", nav_grupos:"Grupos/Eventos",
    importar:"Importer", mi_perfil:"Mon profil", cerrar_sesion:"Déconnexion",
    suscripcion:"Abonnement", extranets:"Extranets", informe_mensual:"Rapport mensuel",
    conectado_como:"Connecté en tant que", cargando:"Chargement...",
    ob_paso:"Étape", ob_de:"sur", ob_omitir:"Ignorer", ob_siguiente:"Suivant →", ob_empezar:"Commencer !",
    ob0_title:"Importez vos données", ob0_text:"Téléchargez le modèle Excel, remplissez-le avec vos données de production et importez-le ici.",
    ob1_title:"Dashboard", ob1_text:"Visualisez vos KPIs principaux : RevPAR, ADR et occupation comparés à l'année précédente.",
    ob2_title:"Pickup", ob2_text:"Analysez le rythme des nouvelles réservations jour par jour et détectez les tendances.",
    ob3_title:"Budget", ob3_text:"Comparez la production réelle vs l'objectif mensuel et projetez la clôture annuelle.",
    ob4_title:"Grupos/Eventos", ob4_text:"Gérez les groupes et événements : confirmés, tentatifs et pipeline.",
    kpi_ocupacion:"Occupation", kpi_adr:"ADR", kpi_revpar:"RevPAR", kpi_trevpar:"TRevPAR",
    kpi_rev_diario:"Revenu Journalier", kpi_rev_mensual:"Revenu Mensuel", kpi_rev_hab:"Rev. Ch.", kpi_rev_total:"Rev. Total",
    sin_datos_prev:"Pas de données préc.", vs_mes_ant:"vs mois préc.", vs_anio_ant:"vs année préc.",
    sin_datos:"Aucune donnée", importa_excel:"Importez votre modèle Excel pour voir vos données ici",
    cargando_datos:"Chargement...", cargando_pickup:"Chargement pickup...",
    meses_full:["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
    meses_corto:["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"],
    dias_semana:["L","M","M","J","V","S","D"],
    dias_abrev:["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
    bienvenido:"Bienvenue", ocup_mensual:"Occupation mensuelle", adr_ocupacion:"ADR & Occupation",
    ultimos_12m:"12 derniers mois", sin_datos_mes:"Pas de données pour ce mois",
    adr_ocup_diaria:"ADR & Occupation journalière", otb:"OTB",
    th_anio:"Année", th_mes:"Mois", th_ocup:"Occup.", th_adr:"ADR",
    th_revpar:"RevPAR", th_trevpar:"TRevPAR", th_rev_hab:"Rev. Ch.", th_rev_total:"Rev. Total",
    th_fecha:"Date", th_hab_ocup:"Ch. Occup.", th_rev_day:"Rev. Total",
    th_ocup_media:"Occup. moy.", th_adr_medio:"ADR moy.", th_revpar_medio:"RevPAR moy.",
    th_rev_hab_total:"Rev. Ch. total", detalle_diario:"Détail journalier",
    dias_con_datos:"jours avec données", total_mes:"TOTAL MOIS", volver:"← Retour",
    reservas_ayer:"Réservations d'hier", reservas_captadas:"réservations captées",
    no_reservas_ayer:"Aucune réservation enregistrée hier",
    por_mes_llegada:"Par mois d'arrivée", por_canal:"Par canal", por_mes_afectado:"Par mois concerné",
    cancelaciones_ayer:"Annulations d'hier", cancelaciones:"annulations",
    sin_cancelaciones:"Aucune annulation hier", cancel_abrev:"annul.",
    duracion_media:"Durée moyenne", noches_reserva:"Nuits par réservation confirmée",
    noches_media:"nuits moy.", precio_medio_reserva:"Prix moyen réservation",
    revenue_medio:"Revenu moyen par réservation confirmée", precio_medio:"prix moy.",
    dia_pico:"Jour pic", res_abrev:"rés.",
    fechas_calientes:"Dates Chaudes", sin_futuras:"Aucune réservation future",
    ventana_reserva:"Fenêtre de réservation", dias_label:"jours",
    este_mes_label:"Ce mois", anio_ant_abrev:"Année préc.", variacion_label:"Variation",
    demanda_debil:"↓ Signal de demande faible", demanda_adelantada:"↑ Demande anticipée",
    analisis_desplazamiento:"Analyse de Déplacement",
    contrib_grupo:"Contrib. groupe", coste_desplaz:"Coût déplac.", valor_neto:"Valeur nette",
    adr_transient_ref:"ADR transient réf.", occ_hist_ly:"Occ. hist. LY",
    adr_minimo_rentable:"ADR min. rentable", acepta_grupo:"✓ Accepter", revisar_grupo:"⚠ Réviser",
    sin_datos_ly:"Pas de données LY — budget utilisé", fuente_ppto:"source : budget",
    rev_real_ytd:"Revenu Réel YTD", forecast_cierre_anio:"Prévision Clôture Année",
    presupuesto_anio:"Budget Annuel", detalle_mensual:"Détail mensuel",
    th_adr_ppto:"ADR Budget", th_adr_real:"ADR Réel", th_desv_adr:"Écart ADR",
    th_revpar_ppto:"RevPAR Budget", th_revpar_real:"RevPAR Réel", th_desv_revpar:"Écart RevPAR",
    th_rev_ppto:"Rev. Budget", th_rev_real:"Rev. Réelle", th_desv_rev:"Écart Rev.",
    th_forecast:"Prévision Clôture", total_ytd:"TOTAL YTD", vs_ppto:"vs budget",
    confianza:"confiance", real_badge:"✓ Réel",
    nuevo_evento:"+ Nouvel événement", sin_eventos:"Aucun événement", rev_estimado:"Chiffre d'affaires estimé",
    editar_evento:"Modifier l'événement", nuevo_evento_title:"Nouvel événement",
    eliminar_grupo:"Supprimer ce groupe ?",
    vista_calendario:"Calendrier", vista_lista:"Liste", vista_pipeline:"Pipeline", vista_tabla:"Tableau",
    rev_confirmado:"Revenu confirmé", rev_tentativo:"Revenu tentative (50%)",
    pipeline_cotizacion:"Pipeline en devis", cancelados_perdidos:"Annulés / Perdus",
    cat_corporativo:"Corporatif", cat_boda:"Mariage / Social", cat_feria:"Foire / Congrès",
    cat_deportivo:"Sportif", cat_otros:"Autres",
    estado_confirmado:"Confirmé", estado_tentativo:"Tentative",
    estado_cotizacion:"En devis", estado_cancelado:"Annulé",
    form_nombre:"Nom de l'événement *", form_categoria:"Catégorie", form_estado:"Statut",
    form_fecha_entrada:"Date d'arrivée *", form_fecha_salida:"Date de départ *", form_fecha_confirmacion:"Date de confirmation",
    form_habitaciones:"Chambres", form_adr:"ADR Groupe", form_fnb:"Revenu F&B",
    form_sala:"Revenu Salle", form_notas:"Notes", form_motivo:"Motif de perte",
    form_guardar:"Enregistrer", form_cancelar:"Annuler", form_eliminar:"Supprimer", guardando_btn:"Enregistrement...",
    noche:"nuit", noches:"nuits", hab_abrev:"ch.",
    importar_title:"Importer des données", importar_sub:"Téléchargez votre modèle Excel FastRev",
    vaciar_datos:"Effacer toutes les données importées", vaciar_confirm:"Effacer toutes les données ?",
    vaciar_desc:"Les données de production, pickup et budget seront supprimées. Cette action est irréversible.",
    vaciando:"Effacement...", si_vaciar:"Oui, tout effacer",
    haz_clic:"Cliquez pour sélectionner le fichier", formato_xlsx:"Format .xlsx · Modèle FastRev",
    importando_xlsx:"L'importation remplacera les données précédentes",
    importado_ok:"Données importées avec succès !", ver_dashboard:"Voir le dashboard",
    dias_produccion:"jours de production importés", reservas_pickup:"réservations pickup importées",
    meses_presupuesto:"mois de budget importés",
    leyendo:"Lecture du fichier...", procesando:"Traitement des feuilles...",
    limpiando:"Suppression des données précédentes...", guardando:"Sauvegarde...",
    imp_datos_title:"Données & Pickup", imp_datos_sub:"Production journalière + réservations pickup",
    imp_ppto_title:"Budget", imp_ppto_sub:"Uniquement la feuille 💰 Budget",
    imp_ppto_ok:"Budget mis à jour",
    empieza_gratis:"Commencez gratuitement 30 jours",
    acceso_completo:"Accès complet à FastRev pendant 30 jours sans frais.",
    precio_sub:"Ensuite, seulement 49€/mois + TVA. Annulez quand vous voulez.",
    empezar_prueba:"Démarrer l'essai gratuit →", redirigiendo:"Redirection...",
    feat_dashboard:"Dashboard KPIs en temps réel", feat_pickup:"Analyse pickup et prévisions",
    feat_presupuesto:"Budget vs réel mensuel", feat_pdf:"Rapports PDF mensuels",
    ver_pickup:"→ Voir Pickup", importar_datos:"→ Importer données", ver_mas:"→ Voir plus",
    prox_semana:"Sem. prochaine", prox_mes:"Mois prochain", anio_actual:"Année en cours",
    otb_actual:"OTB Actuel", anio_anterior:"Année Précédente",
    pace_title:"Pace — 6 prochains mois", pace_sub:"OCC en portefeuille vs Budget et Année Précédente",
    sin_datos_pickup:"Pas de données pickup",
    budget_empty:"Importez votre modèle Excel avec les données de la feuille 💰 Budget pour voir l'analyse ici",
    rev_total_label:"Revenu Total", ppto_abrev:"Budget", real_label:"Réel",
    chart_rev:"Revenu Total — Budget vs Réel vs Prévision",
    chart_adr:"ADR — Budget vs Réel", chart_revpar:"RevPAR — Budget vs Réel",
    generando:"Génération...", cancelar:"Annuler", guardar:"Enregistrer", eliminar:"Supprimer",
    si:"Oui", no:"Non", todos:"Tous",
  },
};

const MESES = ["Enero","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const AnimatedBar = (props) => {
  const { x, y, width, height, fill, onClick } = props;
  const [animKey, setAnimKey] = useState(0);
  if (!height || height <= 0) return null;
  return (
    <g onClick={onClick} style={{ cursor:"pointer", outline:"none" }}
      onMouseEnter={() => setAnimKey(k => k + 1)}>
      {/* Barra base — siempre visible a color completo */}
      <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill}/>
      {/* Overlay de relleno animado desde abajo al hover */}
      {animKey > 0 && (
        <rect key={animKey} x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill}
          style={{
            transformBox:"fill-box",
            transformOrigin:"bottom",
            animation:"bar-fill-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}/>
      )}
    </g>
  );
};

const SimpleBar = ({ x, y, width, height, fill, fillOpacity }) => {
  if (!height || height <= 0) return null;
  return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} fillOpacity={fillOpacity}/>;
};

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const OCC_NAMES = ["Ocupación","occ","OCC"];
  const displayLabel = payload[0]?.payload?.mesNombre || payload[0]?.payload?.fecha || label;
  return (
    <div style={{ background: C.bgDeep, borderRadius: 10, padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.22)" }}>
      <p style={{ color: "#fff", fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>{displayLabel}</p>
      {payload.map((p, i) => {
        const isOcc = unit === "%" || OCC_NAMES.includes(p.name);
        const val = typeof p.value === 'number'
          ? isOcc ? `${Math.round(p.value)}%` : `${Math.round(p.value).toLocaleString("es-ES")}€`
          : p.value;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:p.color||"#7A9CC8", flexShrink:0, display:"inline-block" }}/>
            <span style={{ color:"rgba(255,255,255,0.9)", fontSize:12 }}>{p.name}: {val}</span>
          </div>
        );
      })}
    </div>
  );
};

function WeatherBar({ ciudad, datos }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!ciudad) return;
    fetch(`https://wttr.in/${encodeURIComponent(ciudad.trim())}?format=j1`)
      .then(r => r.json())
      .then(data => {
        const cur = data.current_condition?.[0];
        if (!cur) return;
        setWeather({ temp: cur.temp_C, code: parseInt(cur.weatherCode) });
      })
      .catch(() => {});
  }, [ciudad]);

  const weatherEmoji = (code) => {
    if (!code) return "🌡️";
    if (code === 113) return "☀️";
    if (code === 116) return "⛅";
    if (code === 119 || code === 122) return "☁️";
    if ([143,248,260].includes(code)) return "🌫️";
    if ([176,293,296,353].includes(code)) return "🌦️";
    if ([185,263,266,281,284,311,314,317,350,374,377].includes(code)) return "🌧️";
    if ([200,386,389,392,395].includes(code)) return "⛈️";
    if ([179,182,227,230,323,326,329,332,335,338,356,359,362,365,368,371].includes(code)) return "❄️";
    return "🌡️";
  };
  const WEATHER_ES = { 113:"Despejado", 116:"Parcialmente nublado", 119:"Nublado", 122:"Cubierto", 143:"Niebla", 176:"Lluvia ligera", 179:"Nieve ligera", 182:"Aguanieve", 185:"Llovizna helada", 200:"Tormenta eléctrica", 227:"Ventisca", 230:"Tormenta de nieve", 248:"Niebla", 260:"Niebla helada", 263:"Llovizna", 266:"Llovizna", 281:"Llovizna helada", 284:"Llovizna helada", 293:"Lluvia ligera", 296:"Lluvia ligera", 299:"Lluvia moderada", 302:"Lluvia moderada", 305:"Lluvia intensa", 308:"Lluvia muy intensa", 311:"Lluvia helada", 314:"Lluvia helada", 317:"Aguanieve ligera", 320:"Aguanieve", 323:"Nevada ligera", 326:"Nevada ligera", 329:"Nevada moderada", 332:"Nevada moderada", 335:"Nevada intensa", 338:"Nevada muy intensa", 350:"Granizo", 353:"Lluvia ligera", 356:"Lluvia intensa", 359:"Lluvia torrencial", 362:"Aguanieve ligera", 365:"Aguanieve", 368:"Nevada ligera", 371:"Nevada moderada", 374:"Granizo ligero", 377:"Granizo", 386:"Tormenta con lluvia", 389:"Tormenta con lluvia intensa", 392:"Tormenta con nieve", 395:"Tormenta de nieve" };

  const tickerText = useMemo(() => {
    const produccion = datos?.produccion || [];
    const pickupEntries = datos?.pickupEntries || [];
    const msgs = [];

    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    const ayerStr = ayer.toISOString().slice(0, 10);
    const hoyStr  = hoy.toISOString().slice(0, 10);
    const diaHoy = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    const mesPad = String(mesActual).padStart(2, "0");
    const mesPrefijo = `${anioActual}-${mesPad}`;
    const hab = datos?.hotel?.habitaciones || 30;

    // Movimiento del día (ayer) + ocupación de hoy (OTB)
    const ayerDia = produccion.find(d => d.fecha === ayerStr);
    const resHoy  = pickupEntries.filter(e => String(e.fecha_llegada||"").slice(0,10) === hoyStr && (e.estado||"confirmada") !== "cancelada").reduce((a,e) => a+(e.num_reservas||1), 0);
    const occHoy  = hab > 0 ? Math.round(resHoy / hab * 100) : null;
    if (ayerDia || occHoy) {
      const occ = ayerDia?.hab_disponibles > 0 ? (ayerDia.hab_ocupadas / ayerDia.hab_disponibles * 100).toFixed(1) : null;
      const adr = ayerDia?.adr ? Math.round(ayerDia.adr) : null;
      const resAyer = pickupEntries.filter(e => String(e.fecha_pickup||"").slice(0,10) === ayerStr && (e.estado||"confirmada") !== "cancelada").reduce((a,e) => a+(e.num_reservas||1), 0);
      let msg = "Movimiento del día";
      if (occHoy != null) msg += `  ·  Ocupación hoy ${occHoy}%`;
      if (occ)            msg += `  ·  Occ ayer ${occ}%`;
      if (adr)            msg += `  ·  ADR €${adr.toLocaleString("es-ES")}`;
      if (resAyer > 0)    msg += `  ·  ${resAyer} reserva${resAyer!==1?"s":""} captada${resAyer!==1?"s":""}`;
      msgs.push(msg);
    }

    // Revenue mes actual vs mes anterior y vs año anterior
    const datosMes = produccion.filter(d => d.fecha.startsWith(mesPrefijo));
    const revMes = datosMes.reduce((a,d) => a+(d.revenue_total||d.revenue_hab||0), 0);
    if (revMes > 0) {
      const mesPrevNum = mesActual === 1 ? 12 : mesActual - 1;
      const anioPrev   = mesActual === 1 ? anioActual - 1 : anioActual;
      const mesPrevPfx = `${anioPrev}-${String(mesPrevNum).padStart(2,"0")}`;
      const lyPfx      = `${anioActual-1}-${mesPad}`;

      const datosPrev = produccion.filter(d => d.fecha.startsWith(mesPrevPfx)).slice(0, diaHoy);
      const revPrev   = datosPrev.reduce((a,d) => a+(d.revenue_total||d.revenue_hab||0), 0);
      const datosLY   = produccion.filter(d => d.fecha.startsWith(lyPfx)).slice(0, diaHoy);
      const revLY     = datosLY.reduce((a,d) => a+(d.revenue_total||d.revenue_hab||0), 0);

      let msg = `Revenue del mes: €${Math.round(revMes).toLocaleString("es-ES")}`;
      if (revPrev > 0) {
        const pct = ((revMes-revPrev)/revPrev*100);
        msg += `  ·  vs mes anterior ${pct>=0?"+":""}${pct.toFixed(1)}%`;
      }
      if (revLY > 0) {
        const pct = ((revMes-revLY)/revLY*100);
        msg += `  ·  vs mismo período año anterior ${pct>=0?"+":""}${pct.toFixed(1)}%`;
      }
      msgs.push(msg);
    }

    // Próximos eventos (grupos confirmados/tentativos con fecha_inicio >= hoy)
    const grupos = datos?.grupos || [];
    const proximos = grupos
      .filter(g => g.fecha_inicio >= hoyStr && (g.estado === "confirmado" || g.estado === "tentativo"))
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
      .slice(0, 5);
    if (proximos.length > 0) {
      const fmtFecha = iso => {
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y.slice(2)}`;
      };
      const partes = proximos.map(g => {
        let txt = `${g.estado === "tentativo" ? "⚠ " : ""}${g.nombre}`;
        if (g.fecha_inicio) txt += `  ${fmtFecha(g.fecha_inicio)}`;
        if (g.fecha_fin && g.fecha_fin !== g.fecha_inicio) txt += `→${fmtFecha(g.fecha_fin)}`;
        if (g.habitaciones) txt += `  ·  ${g.habitaciones} hab.`;
        return txt;
      });
      msgs.push(`Próximos eventos  ·  ${partes.join("   |   ")}`);
    }

    if (msgs.length === 0) return "";
    const sep = "          ◆          ";
    const full = msgs.join(sep) + sep;
    return full + full; // duplicar para loop continuo
  }, [datos?.produccion?.length, datos?.pickupEntries?.length, datos?.grupos?.length]);

  const duration = Math.max(25, (tickerText.length / 2) * 0.13);

  if (!ciudad) return null;

  return (
    <div style={{ background:"#F4F8FD", borderBottom:`1px solid #D8E6F3`, position:"sticky", top:52, zIndex:99, height:36, display:"flex", alignItems:"center", overflow:"hidden" }}>

      {/* Ticker */}
      <div style={{ flex:1, overflow:"hidden", padding:"0 16px 0 clamp(12px,4vw,32px)" }}>
        {tickerText ? (
          <div style={{ display:"inline-block", whiteSpace:"nowrap", fontSize:11, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500, animationName:"ticker", animationTimingFunction:"linear", animationIterationCount:"infinite", animationDuration:`${duration}s` }}>
            {tickerText}
          </div>
        ) : (
          <span style={{ fontSize:11, color:C.textLight }}>Cargando datos...</span>
        )}
      </div>

      {/* Ciudad + Tiempo — derecha */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 clamp(12px,4vw,32px) 0 12px", borderLeft:`1px solid #C8D8EA`, flexShrink:0, height:"100%" }}>
        {weather && <span style={{ fontSize:14, lineHeight:1 }}>{weatherEmoji(weather.code)}</span>}
        {weather && <span style={{ fontSize:12, fontWeight:800, color:C.accent }}>{weather.temp}°C</span>}
        {weather && <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{ciudad}</span>}
        {weather && <span style={{ fontSize:11, color:C.textMid }}>{WEATHER_ES[weather.code] || ""}</span>}
      </div>

    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", width: "100%", ...style }}>
      {children}
    </div>
  );
}


// ─── KPI MODAL ───────────────────────────────────────────────────
const KPI_TKEYS = { "Ocupación":"kpi_ocupacion", "ADR":"kpi_adr", "RevPAR":"kpi_revpar", "TRevPAR":"kpi_trevpar", "Revenue Diario":"kpi_rev_diario", "Revenue Mensual":"kpi_rev_mensual", "Revenue Total":"kpi_rev_total" };
function KpiModal({ kpi, datos, mes, anio, onClose }) {
  const t = useT();
  const kpiLabel = t(KPI_TKEYS[kpi]) || kpi;
  const compMode = "mes";

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const { produccion, presupuesto } = datos;
  const MESES_FULL = t("meses_full");

  const [modoVista, setModoVista] = useState("30dias"); // "30dias" | "mes"

  const todasProd = (produccion||[]).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const ultimaFechaMes = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(d => d.fecha).slice(-1)[0];
  const refDate = ultimaFechaMes ? new Date(ultimaFechaMes+"T00:00:00") : new Date();
  const desde30 = new Date(refDate); desde30.setDate(desde30.getDate()-29);
  const desde30Str = desde30.toISOString().slice(0,10);
  const refDateStr  = refDate.toISOString().slice(0,10);

  const diasMes = todasProd
    .filter(d => {
      const f=new Date(d.fecha+"T00:00:00");
      if (modoVista === "mes") return f.getMonth()===mes && f.getFullYear()===anio;
      return d.fecha >= desde30Str && d.fecha <= refDateStr;
    })
    .map(d => {
      const f = new Date(d.fecha+"T00:00:00");
      const habDis = d.hab_disponibles||30;
      return {
        dia: `${f.getDate()}/${f.getMonth()+1}`,
        diaSemana: f.getDay(),
        fecha: f.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),
        occ:    habDis>0 ? Math.round(d.hab_ocupadas/habDis*100) : 0,
        adr:    d.hab_ocupadas>0 ? Math.round(d.revenue_hab/d.hab_ocupadas) : 0,
        revpar: habDis>0 ? Math.round(d.revenue_hab/habDis) : 0,
        trevpar:habDis>0 ? Math.round((d.revenue_hab+(d.revenue_fnb||0))/habDis) : 0,
        revHab: Math.round(d.revenue_hab||0),
        revFnb: Math.round(d.revenue_fnb||0),
        revTotal: Math.round(d.revenue_total||0),
      };
    });

  const mapProd = d => {
    const habDis=d.hab_disponibles||30;
    return {
      dia: new Date(d.fecha+"T00:00:00").getDate(),
      occ: habDis>0?Math.round(d.hab_ocupadas/habDis*100):0,
      adr: d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
      revpar: habDis>0?Math.round(d.revenue_hab/habDis):0,
      trevpar: habDis>0?Math.round((d.revenue_hab+(d.revenue_fnb||0))/habDis):0,
      revHab:  Math.round(d.revenue_hab||0),
      revFnb:  Math.round(d.revenue_fnb||0),
      revTotal: Math.round(d.revenue_total||0),
    };
  };

  const mesPrevIdx = mes === 0 ? 11 : mes - 1;
  const anioPrevModal = mes === 0 ? anio - 1 : anio;
  const diasMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===anioPrevModal; })
    .map(mapProd);

  const diasComp  = diasMP;
  const compLabel = MESES_FULL[mesPrevIdx];

  const ppto = (presupuesto||[]).find(p=>p.mes===mes+1&&p.anio===anio);

  // Año anterior mismo mes
  const diasLY = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; })
    .map(mapProd);

  const getChartData = () => {
    const lyField = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";
    return diasMes.map((d,i)=>({
      ...d,
      mp: diasComp[i]?.[lyField] ?? null,
      ly: diasLY[i]?.[lyField] ?? null,
    }));
  };
  const chartData = getChartData();

  const fk = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const diasMesCompleto = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(mapProd);
  const diasMesCompLetoMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===(mes===0?anio-1:anio); })
    .map(mapProd);

  const srcActual = diasMesCompleto;
  const srcComp   = diasMesCompLetoMP;

  const mediaActual = srcActual.length>0 ? srcActual.reduce((a,d)=>a+(d[fk]||0),0)/srcActual.length : 0;
  const mediaComp   = srcComp.length>0   ? srcComp.reduce((a,d)=>a+(d[fk]||0),0)/srcComp.length   : 0;
  const varComp = mediaComp>0?((mediaActual-mediaComp)/mediaComp*100).toFixed(1):null;
  const fieldKey = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const pptoVal = kpi==="Ocupación"?ppto?.occ_ppto:kpi==="ADR"?ppto?.adr_ppto:kpi==="RevPAR"?ppto?.revpar_ppto:kpi==="Revenue Total"?ppto?.rev_total_ppto:null;
  const varPpto = pptoVal&&mediaActual?((mediaActual-pptoVal)/pptoVal*100).toFixed(1):null;

  const unit = kpi==="Ocupación"?"%":"€";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:820, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL[mes]} {anio}</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5 }}>{kpiLabel}</h3>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.textMid, fontWeight:300, transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
              ×
            </button>
          </div>
        </div>

        {kpi === "Revenue Total" ? (() => {
          const totalHabS  = diasMes.reduce((a,d)=>a+d.revHab,0);
          const totalFnbS  = diasMes.reduce((a,d)=>a+d.revFnb,0);
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalHabS+totalFnbS).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabS).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbS).toLocaleString("es-ES")}`, color:"#E85D04" },
              ].map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${k.color||C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })() : kpi === "Revenue Mensual" ? (() => {
          const totalHabM = diasMesCompleto.reduce((a,d)=>a+d.revHab,0);
          const totalFnbM = diasMesCompleto.reduce((a,d)=>a+d.revFnb,0);
          const totalM    = totalHabM + totalFnbM;
          const totalLM   = diasMesCompLetoMP.reduce((a,d)=>a+d.revHab+d.revFnb,0);
          const totalLY   = diasLY.reduce((a,d)=>a+(d.revHab||0)+(d.revFnb||0),0);
          const vsLMv = totalLM>0?((totalM-totalLM)/totalLM*100).toFixed(1):null;
          const vsLYv = totalLY>0?((totalM-totalLY)/totalLY*100).toFixed(1):null;
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalM).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value:vsLMv?`${parseFloat(vsLMv)>=0?"+":""}${vsLMv}%`:"Sin datos", up:vsLMv?parseFloat(vsLMv)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabM).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbM).toLocaleString("es-ES")}`, color:"#E85D04" },
              ].map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${k.color||C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
              {vsLYv && <div style={{ gridColumn:"1/-1", display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.textLight }}>vs LY ({anio-1}):</span>
                <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:4, background:parseFloat(vsLYv)>=0?C.greenLight:C.redLight, color:parseFloat(vsLYv)>=0?C.green:C.red }}>{parseFloat(vsLYv)>=0?"+":""}{vsLYv}%</span>
              </div>}
            </div>
          );
        })() : (() => {
          const mediaLY = diasLY.length>0 ? diasLY.reduce((a,d)=>a+(d[fk]||0),0)/diasLY.length : 0;
          const varLY = mediaLY>0 ? ((mediaActual-mediaLY)/mediaLY*100).toFixed(1) : null;
          const cards = [
            { label:"Media del mes", value:`${kpi==="Ocupación"?mediaActual.toFixed(1):Math.round(mediaActual).toLocaleString("es-ES")}${unit}` },
            { label:`Vs ${compLabel}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
            { label:`Vs LY (${anio-1})`, value: varLY!==null ? `${parseFloat(varLY)>=0?"+":""}${varLY}%` : "Sin datos", up: varLY!==null?parseFloat(varLY)>=0:true },
          ];
          return (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cards.length},1fr)`, gap:12, marginBottom:20 }}>
              {cards.map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.up===false?C.red:k.up===true?C.green:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <div style={{ marginBottom:16 }}>
          {kpi==="Revenue Mensual" ? (() => {
            const dailyData = diasMesCompleto.map(d=>({ dia:d.dia, revHab:d.revHab, revFnb:d.revFnb }));
            return (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} barSize={10} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="gradHabD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="gradFnbD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E85D04" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#E85D04" stopOpacity={0.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="dia" tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} interval={Math.ceil(dailyData.length/10)-1}/>
                  <YAxis tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k€`:v} width={42}/>
                  <Tooltip content={<CustomTooltip/>} cursor={false}/>
                  <Legend wrapperStyle={{ fontSize:11, color:C.textMid, paddingTop:8 }}/>
                  <Bar dataKey="revHab" name="Hab." stackId="a" fill="url(#gradHabD)" radius={[0,0,0,0]} shape={(p)=><SimpleBar {...p}/>}/>
                  <Bar dataKey="revFnb" name="F&B"  stackId="a" fill="url(#gradFnbD)" radius={[4,4,0,0]} shape={(p)=><SimpleBar {...p}/>}/>
                </BarChart>
              </ResponsiveContainer>
            );
          })() : kpi==="Revenue Total" ? (() => {
            const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            const revPorMes = Array.from({length:12},(_,i)=>{
              const mIdx = ((mes-11+i)%12+12)%12;
              const aIdx = anio + Math.floor((mes-11+i)/12);
              const dias = todasProd.filter(d=>{ const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mIdx && f.getFullYear()===aIdx; });
              return {
                mes: MESES_SHORT[mIdx],
                revHab:   Math.round(dias.reduce((a,d)=>a+(d.revenue_hab||0),0)),
                revFnb:   Math.round(dias.reduce((a,d)=>a+(d.revenue_fnb||0),0)),
              };
            }).filter(d=>d.revHab+d.revFnb>0);
            return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revPorMes} barSize={18} barCategoryGap="32%">
                <defs>
                  <linearGradient id="gradHab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
                  </linearGradient>
                  <linearGradient id="gradFnb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B8860B" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#B8860B" stopOpacity={0.55}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k€`:v} width={48}/>
                <Tooltip content={<CustomTooltip/>} cursor={false}/>
                <Bar dataKey="revHab" name="Hab."   stackId="a" fill="url(#gradHab)" radius={[0,0,0,0]} activeBar={false}/>
                <Bar dataKey="revFnb" name="F&B"    stackId="a" fill="url(#gradFnb)" radius={[4,4,0,0]} activeBar={false}/>
                <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }}/>
              </BarChart>
            </ResponsiveContainer>
            );
          })() : (<>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[["30dias","Últimos 30 días"],["mes","Mes actual"]].map(([key,label])=>(
                  <button key={key} onClick={()=>setModoVista(key)}
                    style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${modoVista===key?C.accent:C.border}`, background:modoVista===key?C.accentLight:"transparent", color:modoVista===key?C.accent:C.textLight, fontSize:11, fontWeight:modoVista===key?600:400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:12, height:10, background:C.accent, borderRadius:2 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Actual</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:18, height:2, background:"#B8860B", borderRadius:1 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Año anterior</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="kpiGradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} interval={modoVista==="mes"?1:4}/>
                <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit={unit}/>
                <Tooltip content={<CustomTooltip unit={unit}/>} cursor={false}/>
                <Bar dataKey={fieldKey} name={kpi} fill="url(#kpiGradBar)" radius={[4,4,0,0]} barSize={modoVista==="mes"?10:6} activeBar={false}/>
                <Line type="monotone" dataKey="ly" name="Año anterior" stroke="#B8860B" strokeWidth={2} dot={{fill:"#B8860B", r:3, strokeWidth:0}} activeDot={{r:4}} connectNulls/>
              </ComposedChart>
            </ResponsiveContainer>
          </>)}
        </div>

     </div>
    </div>
  );
}

function KpiCard({ label, subtitle, value, changeLm, upLm, changeLy, upLy, i, onClick, accentColor }) {
  const kpiAccent = accentColor || C.accent;
  return (
    <div onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "20px 22px", animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
      borderLeft: `3px solid ${kpiAccent}`, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
      transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s, background 0.2s",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
    }}
    onMouseEnter={e=>{
      e.currentTarget.style.boxShadow=`0 6px 24px ${kpiAccent}40`;
      e.currentTarget.style.transform="translateY(-2px)";
      e.currentTarget.style.borderColor=kpiAccent;
      e.currentTarget.style.background=`${kpiAccent}08`;
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";
      e.currentTarget.style.transform="translateY(0)";
      e.currentTarget.style.borderColor=C.border;
      e.currentTarget.style.borderLeftColor=kpiAccent;
      e.currentTarget.style.background=C.bgCard;
    }}>
      <p style={{ fontSize: 12, color: C.text, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>{label}</p>
      {subtitle && <p style={{ fontSize: 10, color: C.textMid, marginTop: 2, letterSpacing: "0.5px", opacity: 0.7 }}>{subtitle}</p>}
      <p style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text, margin: "8px 0 6px", letterSpacing: "-1px", lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function PeriodSelectorInline({ mes, anio, onChange, aniosDisponibles }) {
  const t = useT();
  const hoy = new Date();
  const anioMax = hoy.getFullYear();
  const anios = aniosDisponibles && aniosDisponibles.length > 0 ? aniosDisponibles : [anioMax];
  const MESES_C = t("meses_full");

  const anioAnterior = () => {
    const idx = anios.indexOf(anio);
    if (idx > 0) onChange(mes, anios[idx-1]);
  };
  const anioSiguiente = () => {
    const idx = anios.indexOf(anio);
    if (idx < anios.length-1) onChange(mes, anios[idx+1]);
  };
  const puedeAnterior = anios.indexOf(anio) > 0;
  const puedeSiguiente = anios.indexOf(anio) < anios.length-1;
  const btnFlecha = (activo) => ({ background:"none", border:`1px solid ${activo?C.border:"transparent"}`, borderRadius:6, width:22, height:22, cursor:activo?"pointer":"default", color:activo?C.textMid:C.border, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 });

  return (
    <div style={{ userSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
        <button onClick={anioAnterior} style={btnFlecha(puedeAnterior)}>‹</button>
        <p style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:36, textAlign:"center" }}>{anio}</p>
        <button onClick={anioSiguiente} style={btnFlecha(puedeSiguiente)}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
        {MESES_C.map((m, i) => {
          const futuro = anio === anioMax && i > hoy.getMonth();
          const activo = i === mes;
          const esHoyMes = i === hoy.getMonth() && anio === hoy.getFullYear();
          return (
            <button key={i} onClick={() => !futuro && onChange(i, anio)}
              style={{
                padding: "5px 4px",
                borderRadius: 6,
                border: esHoyMes && !activo ? `1.5px solid ${C.accent}66` : `1px solid ${activo?C.accent:C.border}`,
                background: activo ? C.accent : "transparent",
                color: futuro ? C.textLight : activo ? "#fff" : C.text,
                fontSize: 11, fontWeight: activo ? 700 : 500, opacity: futuro ? 0.3 : 1,
                cursor: futuro ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                textAlign: "center",
                transition: "all 0.1s",
              }}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}





function LoadingSpinner() {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ color: C.accent, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{t("cargando_datos")}</div>
    </div>
  );
}

function EmptyState({ mensaje }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", padding: 60 }}>

      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t("sin_datos")}</p>
      <p style={{ fontSize: 13, color: C.textLight }}>{mensaje || t("importa_excel")}</p>
    </div>
  );
}

// ─── IMPORTAR EXCEL ───────────────────────────────────────────────
function ImportarExcel({ onClose, session, onImportado, hotelNombre: hotelNombreProp }) {
  const t = useT();
  // Pestaña activa
  const [activeBlock, setActiveBlock] = useState("presupuesto");
  // Estado datos principales (Histórico)
  const [loadingMain, setLoadingMain] = useState(false);
  const [resultadoMain, setResultadoMain] = useState(null);
  const [errorMain, setErrorMain] = useState("");
  const [progresoMain, setProgresoMain] = useState("");
  const [progresoPctMain, setProgresoPctMain] = useState(0);
  // Edición por fecha (Histórico)
  const [fechaBusqueda, setFechaBusqueda] = useState("");
  const [diaEncontrado, setDiaEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState("");
  const [okEdit, setOkEdit] = useState(false);
  // Estado presupuesto
  const [loadingPpto, setLoadingPpto] = useState(false);
  const [resultadoPpto, setResultadoPpto] = useState(null);
  const [errorPpto, setErrorPpto] = useState("");
  const [progresoPpto, setProgresoPpto] = useState("");
  const [progresoPctPpto, setProgresoPctPpto] = useState(0);
  // Estado pick up diario
  const [pickupForm, setPickupForm] = useState({
    fecha_pickup: new Date().toISOString().slice(0,10),
    fecha_llegada: "", canal: "", num_reservas: "1",
    fecha_salida: "", noches: "", precio_total: "", estado: "confirmada",
  });
  const [guardandoPickup, setGuardandoPickup] = useState(false);
  const [errorPickup, setErrorPickup] = useState("");
  const [pickupRecientes, setPickupRecientes] = useState([]);
  const [okPickup, setOkPickup] = useState(false);
  // Estado producción diaria
  const [prodForm, setProdForm] = useState({
    fecha: new Date().toISOString().slice(0,10),
    hab_ocupadas: "", hab_disponibles: "",
    revenue_hab: "", revenue_total: "", revenue_fnb: "",
  });
  const [guardandoProd, setGuardandoProd] = useState(false);
  const [errorProd, setErrorProd] = useState("");
  const [okProd, setOkProd] = useState(false);
  const [prodRecientes, setProdRecientes] = useState([]);
  // Vaciar
  const [vaciando, setVaciando] = useState(false);
  const [confirmVaciar, setConfirmVaciar] = useState(false);

  const vaciarDatos = async () => {
    setVaciando(true);
    try {
      await Promise.all([
        supabase.from("produccion_diaria").delete().eq("hotel_id", session.user.id),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id),
        supabase.from("presupuesto").delete().eq("hotel_id", session.user.id),
      ]);
      setConfirmVaciar(false);
      onImportado();
      onClose();
    } catch(e) {
      setErrorMain("Error al vaciar datos: " + e.message);
    }
    setVaciando(false);
  };

  const validarArchivo = (file) => {
    if (file.size > 10 * 1024 * 1024) throw new Error("El archivo es demasiado grande (máx. 10 MB)");
    const TIPOS_VALIDOS = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    if (!TIPOS_VALIDOS.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      throw new Error("Formato no válido. Sube un archivo .xlsx");
    }
  };

  // ── Import datos principales: producción + pickup (sin presupuesto) ──
  const procesarPrincipal = async (file) => {
    setLoadingMain(true); setErrorMain(""); setResultadoMain(null); setProgresoPctMain(0);
    try {
      validarArchivo(file);
      setProgresoMain(t("leyendo")); setProgresoPctMain(5);
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { sheets: ["📅 Producción Diaria", "🎯 Pickup", "🏨 Mi Hotel"] });
      setProgresoPctMain(15);

      // ── Producción Diaria ──
      const ws = wb.Sheets["📅 Producción Diaria"];
      if (!ws) throw new Error("No se encontró la hoja '📅 Producción Diaria'");

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 4 });
      const produccionRows = [];

      const wsHotel = wb.Sheets["🏨 Mi Hotel"];
      const hotelRows = wsHotel ? XLSX.utils.sheet_to_json(wsHotel, { header: 1 }) : [];
      const totalHab = parseFloat(hotelRows?.[8]?.[4]) || null;

      for (const row of rows) {
        if (!row[0]) continue;
        const fecha = row[0];
        const hab_ocupadas = parseFloat(row[1]) || null;
        const hab_disponibles = parseFloat(row[2]) || totalHab;
        const revenue_hab = parseFloat(row[3]) || null;
        const revenue_total = parseFloat(row[4]) || null;
        const revenue_fnb = parseFloat(row[5]) || null;
        if (!hab_ocupadas && !revenue_hab) continue;

        let fechaISO;
        if (typeof fecha === "number") {
          const d = XLSX.SSF.parse_date_code(fecha);
          fechaISO = `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
        } else if (typeof fecha === "string") {
          const parts = fecha.split("/");
          if (parts.length === 3) fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (!fechaISO) continue;

        const adr = hab_ocupadas > 0 ? revenue_hab / hab_ocupadas : null;
        const revpar = hab_disponibles > 0 ? revenue_hab / hab_disponibles : null;
        const trevpar = hab_disponibles > 0 ? ((revenue_hab||0)+(revenue_fnb||0)) / hab_disponibles : null;

        produccionRows.push({
          hotel_id: session.user.id, fecha: fechaISO,
          hab_ocupadas, hab_disponibles, revenue_hab, revenue_total,
          revenue_fnb,
          adr: adr ? Math.round(adr*100)/100 : null,
          revpar: revpar ? Math.round(revpar*100)/100 : null,
          trevpar: trevpar ? Math.round(trevpar*100)/100 : null,
        });
      }


      // ── Pickup — hoja "🎯 Pickup", datos desde fila 5 ──
      // raw:false hace que SheetJS convierta datetime → string "YYYY-MM-DD"
      const wsPu = wb.Sheets["🎯 Pickup"];
      const pickupRows = [];
      if (wsPu) {
        // Leer toda la hoja sin range fijo — buscar filas con seriales de fecha válidos
        const rowsPu = XLSX.utils.sheet_to_json(wsPu, { header: 1, raw: true });
        const esSerial = (v) => typeof v === "number" && v > 40000 && v < 60000;
        const serialToDate = (v) => {
          const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
          return d.toISOString().slice(0, 10);
        };
        for (const row of rowsPu) {
          if (!row || row.length < 2) continue;
          if (!esSerial(row[0]) || !esSerial(row[1])) continue;
          const fp = serialToDate(row[0]);
          const fl = serialToDate(row[1]);
          // col2=canal, col3=num_reservas (puede ser número o serial pequeño 1900-xx)
          const nrRaw = row[3];
          const nr = typeof nrRaw === "number"
            ? (nrRaw < 40000 ? Math.round(nrRaw) : 1)  // serial < 40000 = número real de reservas
            : (parseInt(nrRaw) || 1);
          // Nuevos campos: col4=fecha_salida, col5=noches, col6=precio_total, col7=estado
          const fechaSalida = row[4] && esSerial(row[4]) ? serialToDate(row[4]) : null;
          const noches      = row[5] && typeof row[5] === "number" && row[5] < 100 ? Math.round(row[5]) : null;
          const precioTotal = row[6] && typeof row[6] === "number" ? Math.round(row[6] * 100) / 100 : null;
          const estado      = row[7] && typeof row[7] === "string" ? row[7] : "confirmada";
          pickupRows.push({
            hotel_id:      session.user.id,
            fecha_pickup:  fp,
            fecha_llegada: fl,
            canal:         row[2] || null,
            num_reservas:  nr || 1,
            fecha_salida:  fechaSalida,
            noches:        noches,
            precio_total:  precioTotal,
            estado:        estado || "confirmada",
          });
        }
      }

      if (produccionRows.length === 0) throw new Error("No se encontró la hoja '📅 Producción Diaria' o está vacía");

      setProgresoMain(t("procesando")); setProgresoPctMain(30);

      // Detectar años y limpiar
      const aniosImport = [...new Set(produccionRows.map(r => r.fecha.slice(0, 4)))];
      // Años en pickup (por fecha_llegada)
      const aniosPickup = [...new Set(pickupRows.map(r => r.fecha_llegada.slice(0, 4)))];
      const todosAnios  = [...new Set([...aniosImport, ...aniosPickup])];

      setProgresoMain(t("limpiando")); setProgresoPctMain(40);
      await Promise.all([
        ...aniosImport.map(anio =>
          supabase.from("produccion_diaria").delete()
            .eq("hotel_id", session.user.id)
            .gte("fecha", `${anio}-01-01`).lte("fecha", `${anio}-12-31`)
        ),
        ...todosAnios.map(anio =>
          supabase.from("pickup_entries").delete()
            .eq("hotel_id", session.user.id)
            .gte("fecha_llegada", `${anio}-01-01`).lte("fecha_llegada", `${anio}-12-31`)
        ),
      ]);

      setProgresoMain(t("guardando")); setProgresoPctMain(55);

      const LOTE_PROD = 500;
      const lotesProd = [];
      for (let i = 0; i < produccionRows.length; i += LOTE_PROD) lotesProd.push(produccionRows.slice(i, i + LOTE_PROD));
      const insertPromises = [
        Promise.all(lotesProd.map(lote =>
          supabase.from("produccion_diaria").insert(lote).then(({ error }) => {
            if (error) throw new Error("Error al guardar producción: " + error.message);
          })
        )).then(() => setProgresoPctMain(p => Math.max(p, 70))),
      ];

      if (pickupRows.length > 0) {
        const LOTE = 500;
        const total = pickupRows.length;
        const lotes = [];
        for (let i = 0; i < total; i += LOTE) lotes.push(pickupRows.slice(i, i + LOTE));
        insertPromises.push(
          Promise.all(lotes.map((lote, idx) =>
            supabase.from("pickup_entries").insert(lote).then(({ error }) => {
              if (error) throw new Error("Error al guardar pickup: " + error.message);
              const pct = Math.round(55 + ((idx + 1) / lotes.length) * 35);
              setProgresoPctMain(pct);
              setProgresoMain(`Guardando pickup... ${Math.min((idx+1)*LOTE, total)} de ${total}`);
            })
          )).then(() => setProgresoMain(""))
        );
      }

      await Promise.all(insertPromises);
      setProgresoPctMain(90);

      if (totalHab) {
        await supabase.from("hoteles").update({ habitaciones: totalHab }).eq("id", session.user.id);
      }

      setProgresoPctMain(100);
      setResultadoMain({ produccion: produccionRows.length, pickup: pickupRows.length });
      if (onImportado) onImportado();

      // Enviar informe por email (fire & forget)
      const ultimoDia = [...produccionRows].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
      if (ultimoDia && session?.user?.email) {
        const mesActual  = parseInt(ultimoDia.fecha.split('-')[1]);
        const anioActual = parseInt(ultimoDia.fecha.split('-')[0]);
        const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

        // Revenue acumulado del mes día a día
        const mesPrefijo = `${anioActual}-${String(mesActual).padStart(2,'0')}`;
        const datosMes = produccionRows
          .filter(d => d.fecha.startsWith(mesPrefijo))
          .sort((a, b) => a.fecha.localeCompare(b.fecha));
        let acum = 0;
        const revenueAcumulado = datosMes.map(d => {
          acum += d.revenue_hab || 0;
          return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) };
        });

        const presupuestoMensual = null; // El presupuesto se importa por separado

        // Pickup de ayer
        const ayerStr = ultimoDia.fecha;
        const pickupAyer = pickupRows.filter(p => p.fecha_pickup === ayerStr);
        let nuevasAyer = 0, cancelAyer = 0, revPickupAyer = 0;
        for (const p of pickupAyer) {
          const nr = p.num_reservas || 1;
          if (p.estado === 'cancelada') { cancelAyer += nr; }
          else { nuevasAyer += nr; revPickupAyer += p.precio_total || nr * (ultimoDia.adr || 0); }
        }

        // LY: mismo día del año anterior
        const lyFecha = `${anioActual - 1}-${ultimoDia.fecha.slice(5)}`;
        const lyDia   = produccionRows.find(d => d.fecha === lyFecha);
        const lyOcc   = lyDia && lyDia.hab_disponibles > 0 ? (lyDia.hab_ocupadas / lyDia.hab_disponibles * 100) : null;

        fetch('/api/import-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({
            email: session.user.email,
            hotelNombre: hotelNombreProp || null,
            kpis: {
              fecha: ultimoDia.fecha,
              mesNombre: MESES[mesActual - 1],
              occ: ultimoDia.hab_disponibles > 0 ? (ultimoDia.hab_ocupadas / ultimoDia.hab_disponibles * 100) : null,
              adr: ultimoDia.adr,
              revpar: ultimoDia.revpar,
              trevpar: ultimoDia.trevpar,
              revenue_hab: ultimoDia.revenue_hab,
              hab_ocupadas: ultimoDia.hab_ocupadas,
              hab_disponibles: ultimoDia.hab_disponibles,
              pickup_neto: nuevasAyer,
              cancelaciones: cancelAyer,
              revenue_pickup_ayer: revPickupAyer,
              revenueAcumulado,
              presupuestoMensual,
              total_registros: produccionRows.length,
              ly_occ:    lyOcc,
              ly_adr:    lyDia?.adr    ?? null,
              ly_revpar: lyDia?.revpar ?? null,
              ly_trevpar:lyDia?.trevpar?? null,
            },
          }),
        }).catch(() => {});

        // Informe mensual: solo el último día del mes
        const lastDayOfMonth = new Date(anioActual, mesActual, 0).getDate();
        if (parseInt(ultimoDia.fecha.split('-')[2]) === lastDayOfMonth) {
          const totalHabOcup = datosMes.reduce((a, d) => a + (d.hab_ocupadas  || 0), 0);
          const totalHabDisp = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
          const totalRevHab  = datosMes.reduce((a, d) => a + (d.revenue_hab   || 0), 0);
          const totalRevTot  = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
          const occMes    = totalHabDisp > 0 ? totalHabOcup / totalHabDisp * 100 : null;
          const adrMes    = totalHabOcup > 0 ? totalRevHab  / totalHabOcup       : null;
          const revparMes = totalHabDisp > 0 ? totalRevHab  / totalHabDisp       : null;
          const trevparMes= totalHabDisp > 0 ? totalRevTot  / totalHabDisp       : null;

          const datosMesLY   = produccionRows.filter(d => d.fecha.startsWith(`${anioActual - 1}-${String(mesActual).padStart(2,'0')}`));
          const lyHabOcup = datosMesLY.reduce((a, d) => a + (d.hab_ocupadas  || 0), 0);
          const lyHabDisp = datosMesLY.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
          const lyRevHab  = datosMesLY.reduce((a, d) => a + (d.revenue_hab   || 0), 0);
          const lyRevTot  = datosMesLY.reduce((a, d) => a + (d.revenue_total || 0), 0);

          // Generar PDF en cliente y enviarlo como adjunto
          let pdfBase64 = null;
          try {
            const datosParaPDF = { produccion: produccionRows, presupuesto: [] };
            pdfBase64 = await generarReportePDF(datosParaPDF, mesActual - 1, anioActual, hotelNombreProp || 'Mi Hotel', true);
          } catch (pdfErr) { console.error('PDF gen error:', pdfErr); }

          fetch('/api/monthly-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({
              email: session.user.email,
              hotelNombre: hotelNombreProp || null,
              pdfBase64,
              pdfNombre: `Informe_${MESES[mesActual - 1]}_${anioActual}.pdf`,
              kpis: {
                mes: mesActual,
                anio: anioActual,
                mesNombre: MESES[mesActual - 1],
                occ:     occMes,
                adr:     adrMes,
                revpar:  revparMes,
                trevpar: trevparMes,
                revenue_hab:   totalRevHab,
                revenue_total: totalRevTot,
                hab_ocupadas:  totalHabOcup,
                hab_disponibles: totalHabDisp,
                presupuesto: presupuestoMensual,
                ly_occ:           lyHabDisp > 0 ? lyHabOcup / lyHabDisp * 100 : null,
                ly_adr:           lyHabOcup > 0 ? lyRevHab  / lyHabOcup       : null,
                ly_revpar:        lyHabDisp > 0 ? lyRevHab  / lyHabDisp       : null,
                ly_trevpar:       lyHabDisp > 0 ? lyRevTot  / lyHabDisp       : null,
                ly_revenue_total: lyRevTot > 0 ? lyRevTot : null,
              },
            }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      setErrorMain(e.message);
      setProgresoPctMain(0);
    }
    setLoadingMain(false);
  };

  // ── Import presupuesto: sólo hoja 💰 Presupuesto ──
  const procesarPresupuesto = async (file) => {
    setLoadingPpto(true); setErrorPpto(""); setResultadoPpto(null); setProgresoPctPpto(0);
    try {
      validarArchivo(file);
      setProgresoPpto(t("leyendo")); setProgresoPctPpto(10);
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { sheets: ["💰 Presupuesto"] });
      setProgresoPctPpto(30);

      const wsBu = wb.Sheets["💰 Presupuesto"];
      if (!wsBu) throw new Error("No se encontró la hoja '💰 Presupuesto'");

      const rowsBu = XLSX.utils.sheet_to_json(wsBu, { header: 1 });
      const MESES_PPTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                          "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      let bloques = [];
      for (let r = 0; r < rowsBu.length; r++) {
        const asNum = parseInt(rowsBu[r]?.[0]);
        if (asNum >= 2020 && asNum <= 2035) {
          for (let s = r+1; s <= r+5; s++) {
            if (rowsBu[s]?.[0] === "Enero") { bloques.push({ anio: asNum, startRow: s }); break; }
          }
        }
      }
      if (bloques.length === 0) {
        // Fallback: buscar primer "Enero" y asumir año actual
        const anioFallback = new Date().getFullYear();
        for (let r = 0; r < rowsBu.length; r++) {
          if (rowsBu[r]?.[0] === "Enero") { bloques.push({ anio: anioFallback, startRow: r }); break; }
        }
      }
      if (bloques.length === 0) throw new Error("No se encontraron datos de presupuesto en la hoja");

      const presupuestoRows = [];
      for (const { anio: anioBloque, startRow } of bloques) {
        for (let i = 0; i < 12; i++) {
          const row = rowsBu[startRow + i];
          if (!row || !MESES_PPTO.includes(row[0])) continue;
          const occ_ppto       = parseFloat(row[1])  || null;
          const adr_ppto       = parseFloat(row[4])  || null;
          const revpar_ppto    = parseFloat(row[7])  || null;
          const rev_total_ppto = parseFloat(row[10]) || null;
          if (!occ_ppto && !adr_ppto && !revpar_ppto && !rev_total_ppto) continue;
          presupuestoRows.push({
            hotel_id: session.user.id,
            anio: anioBloque,
            mes: i + 1,
            occ_ppto:       occ_ppto       ? Math.round(occ_ppto * 1000) / 10 : null,
            adr_ppto:       adr_ppto       ? Math.round(adr_ppto * 100) / 100 : null,
            revpar_ppto:    revpar_ppto    ? Math.round(revpar_ppto * 100) / 100 : null,
            rev_total_ppto: rev_total_ppto ? Math.round(rev_total_ppto) : null,
          });
        }
      }
      if (presupuestoRows.length === 0) throw new Error("No se encontraron datos de presupuesto");

      setProgresoPpto(t("limpiando")); setProgresoPctPpto(55);
      const aniosPpto = [...new Set(bloques.map(b => b.anio))];
      await Promise.all(aniosPpto.map(a =>
        supabase.from("presupuesto").delete().eq("hotel_id", session.user.id).eq("anio", a)
      ));

      setProgresoPpto(t("guardando")); setProgresoPctPpto(75);
      const { error } = await supabase.from("presupuesto").insert(presupuestoRows);
      if (error) throw new Error("Error al guardar presupuesto: " + error.message);

      setProgresoPctPpto(100);
      setResultadoPpto({ presupuesto: presupuestoRows.length });
      setShowPptoZone(false);
      if (onImportado) onImportado();
    } catch (e) {
      setErrorPpto(e.message);
      setProgresoPctPpto(0);
    }
    setLoadingPpto(false);
  };


  // ── Producción diaria (upsert por fecha) ──
  const guardarProduccion = async () => {
    setGuardandoProd(true); setErrorProd(""); setOkProd(false);
    try {
      if (!prodForm.fecha) throw new Error("La fecha es obligatoria");
      const hab_ocupadas    = parseFloat(prodForm.hab_ocupadas)    || null;
      const hab_disponibles = parseFloat(prodForm.hab_disponibles) || null;
      const revenue_hab     = parseFloat(prodForm.revenue_hab)     || null;
      const revenue_total   = parseFloat(prodForm.revenue_total)   || null;
      const revenue_fnb     = parseFloat(prodForm.revenue_fnb)     || null;
      if (!hab_ocupadas && !revenue_hab) throw new Error("Introduce al menos Hab. Ocupadas o Rev. Habitaciones");
      const adr    = hab_ocupadas > 0 && revenue_hab ? Math.round(revenue_hab / hab_ocupadas * 100) / 100 : null;
      const revpar = hab_disponibles > 0 && revenue_hab ? Math.round(revenue_hab / hab_disponibles * 100) / 100 : null;
      const trevpar = hab_disponibles > 0 ? Math.round(((revenue_hab||0)+(revenue_fnb||0)) / hab_disponibles * 100) / 100 : null;
      const row = {
        hotel_id: session.user.id, fecha: prodForm.fecha,
        hab_ocupadas, hab_disponibles, revenue_hab, revenue_total, revenue_fnb,
        adr, revpar, trevpar,
      };
      const { data: existing } = await supabase.from("produccion_diaria")
        .select("id").eq("hotel_id", session.user.id).eq("fecha", prodForm.fecha).maybeSingle();
      const { error } = existing
        ? await supabase.from("produccion_diaria").update(row).eq("hotel_id", session.user.id).eq("fecha", prodForm.fecha)
        : await supabase.from("produccion_diaria").insert(row);
      if (error) throw new Error(error.message);
      setProdRecientes(prev => [row, ...prev.filter(r => r.fecha !== prodForm.fecha)].slice(0, 8));
      setProdForm(f => ({...f, hab_ocupadas:"", hab_disponibles:"", revenue_hab:"", revenue_total:"", revenue_fnb:""}));
      setOkProd(true); setTimeout(() => setOkProd(false), 3000);
      if (onImportado) onImportado();
    } catch(e) { setErrorProd(e.message); }
    setGuardandoProd(false);
  };

  // ── Buscar y editar día histórico ──
  const buscarDia = async () => {
    if (!fechaBusqueda) return;
    setBuscando(true); setErrorEdit(""); setOkEdit(false); setDiaEncontrado(null);
    const { data } = await supabase.from("produccion_diaria").select("*")
      .eq("hotel_id", session.user.id).eq("fecha", fechaBusqueda).maybeSingle();
    if (!data) { setErrorEdit(`No hay datos para ${fechaBusqueda}`); }
    else {
      setDiaEncontrado(data);
      setEditValues({
        hab_ocupadas: data.hab_ocupadas ?? "", hab_disponibles: data.hab_disponibles ?? "",
        revenue_hab: data.revenue_hab ?? "", revenue_total: data.revenue_total ?? "",
        revenue_fnb: data.revenue_fnb ?? "",
      });
    }
    setBuscando(false);
  };

  const guardarDia = async () => {
    setGuardandoEdit(true); setErrorEdit(""); setOkEdit(false);
    const hab_ocupadas    = parseFloat(editValues.hab_ocupadas)    || null;
    const hab_disponibles = parseFloat(editValues.hab_disponibles) || null;
    const revenue_hab     = parseFloat(editValues.revenue_hab)     || null;
    const revenue_total   = parseFloat(editValues.revenue_total)   || null;
    const revenue_fnb     = parseFloat(editValues.revenue_fnb)     || null;
    const adr    = hab_ocupadas > 0 && revenue_hab ? Math.round(revenue_hab / hab_ocupadas * 100) / 100 : null;
    const revpar = hab_disponibles > 0 && revenue_hab ? Math.round(revenue_hab / hab_disponibles * 100) / 100 : null;
    const trevpar = hab_disponibles > 0 ? Math.round(((revenue_hab||0)+(revenue_fnb||0)) / hab_disponibles * 100) / 100 : null;
    const { error } = await supabase.from("produccion_diaria")
      .update({ hab_ocupadas, hab_disponibles, revenue_hab, revenue_total, revenue_fnb, adr, revpar, trevpar })
      .eq("hotel_id", session.user.id).eq("fecha", fechaBusqueda);
    if (error) { setErrorEdit("Error: " + error.message); }
    else { setOkEdit(true); if (onImportado) onImportado(); }
    setGuardandoEdit(false);
  };

  // ── Guardar pickup diario manual ──
  const guardarPickup = async () => {
    setGuardandoPickup(true); setErrorPickup(""); setOkPickup(false);
    try {
      if (!pickupForm.fecha_llegada) throw new Error("La fecha de llegada es obligatoria");
      const row = {
        hotel_id:      session.user.id,
        fecha_pickup:  pickupForm.fecha_pickup,
        fecha_llegada: pickupForm.fecha_llegada,
        canal:         pickupForm.canal || null,
        num_reservas:  parseInt(pickupForm.num_reservas) || 1,
        fecha_salida:  pickupForm.fecha_salida || null,
        noches:        pickupForm.noches ? parseInt(pickupForm.noches) : null,
        precio_total:  pickupForm.precio_total ? parseFloat(pickupForm.precio_total) : null,
        estado:        pickupForm.estado || "confirmada",
      };
      const { error } = await supabase.from("pickup_entries").insert(row);
      if (error) throw new Error(error.message);
      setPickupRecientes(prev => [row, ...prev].slice(0, 8));
      setPickupForm(f => ({...f, fecha_llegada:"", canal:"", num_reservas:"1", fecha_salida:"", noches:"", precio_total:""}));
      setOkPickup(true);
      setTimeout(() => setOkPickup(false), 3000);
      if (onImportado) onImportado();
    } catch(e) { setErrorPickup(e.message); }
    setGuardandoPickup(false);
  };

  // ── Paleta clara (igual que el resto de la web) ──
  const H = {
    bg:      "#FDFDFD",
    card:    "#FFFFFF",
    card2:   "#F4F7FA",
    border:  "#E0E5EC",
    accent:  "#C8933A",
    accentD: "#A07228",
    blue:    "#004B87",
    text:    "#1A1A1A",
    textMid: "#666E7A",
    green:   "#009F4D",
    red:     "#D32F2F",
  };

  const UploadZone = ({ id, loading, resultado, error, progreso, progresoPct, onFile, okContent }) => (
    <div>
      {resultado ? (
        <div style={{ background:"rgba(46,204,113,0.12)", border:"1px solid rgba(46,204,113,0.3)", borderRadius:10, padding:"14px 18px" }}>{okContent}</div>
      ) : (
        <>
          <div onClick={() => !loading && document.getElementById(id).click()}
            style={{ border:`2px dashed ${H.border}`, borderRadius:10, padding:"32px 16px", textAlign:"center", cursor:loading?"default":"pointer", background:H.card, transition:"border-color 0.2s" }}>
            <div style={{ marginBottom:10, display:"flex", justifyContent:"center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={H.border} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p style={{ fontWeight:600, color:H.text, fontSize:13, marginBottom:4 }}>{progreso || (loading ? t("procesando") : t("haz_clic"))}</p>
            <p style={{ fontSize:11, color:H.textMid }}>Soporta .xlsx — plantilla FastRev Pro</p>
            {loading && (
              <div style={{ marginTop:12 }}>
                <div style={{ background:H.border, borderRadius:999, height:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:999, background:`linear-gradient(90deg,${H.accentD},${H.accent})`, width:`${progresoPct}%`, transition:"width 0.4s ease" }}/>
                </div>
                <p style={{ fontSize:10, color:H.textMid, marginTop:4 }}>{progresoPct}%</p>
              </div>
            )}
            <input id={id} type="file" accept=".xlsx" style={{ display:"none" }} onChange={e => e.target.files[0] && onFile(e.target.files[0])}/>
          </div>
          {error && <div style={{ background:"rgba(231,76,60,0.12)", border:"1px solid rgba(231,76,60,0.3)", color:"#F1948A", padding:"8px 12px", borderRadius:8, fontSize:12, marginTop:8 }}>{error}</div>}
        </>
      )}
    </div>
  );

  const inputStyle = { width:"100%", padding:"7px 10px", border:`1px solid ${H.border}`, borderRadius:6, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", background:H.card2, color:H.text, boxSizing:"border-box", outline:"none" };
  const labelStyle = { fontSize:10, color:H.textMid, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.8px", display:"block" };

  const TabIcons = {
    presupuesto: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 10h2M11 10h6M7 13h4"/>
      </svg>
    ),
    historico: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l4 2"/>
      </svg>
    ),
    produccion: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="m7 16 4-4 4 4 4-4"/>
      </svg>
    ),
    pickup: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  };

  const tabs = [
    { id:"presupuesto", label:"Presupuesto",      done: !!resultadoPpto },
    { id:"historico",   label:"Histórico",         done: !!resultadoMain },
    { id:"produccion",  label:"Producción Diaria", done: prodRecientes.length > 0 },
    { id:"pickup",      label:"Pick Up",            done: pickupRecientes.length > 0 },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:1000, overflowY:"auto", padding:"32px 0" }}>
      <div style={{ background:H.bg, borderRadius:14, width:620, maxWidth:"95vw", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden", border:`1px solid ${H.border}` }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 26px 18px" }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:H.text, letterSpacing:0.2 }}>
            Gestión de datos
          </h2>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${H.border}`, borderRadius:7, width:28, height:28, cursor:"pointer", fontSize:14, color:H.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
        </div>

        {/* Tab cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, padding:"0 26px 20px" }}>
          {tabs.map(tab => {
            const active = activeBlock === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveBlock(tab.id)}
                style={{ background: active ? "#EBF2FA" : H.card, border:`1px solid ${active ? H.blue : H.border}`, borderRadius:10, padding:"14px 8px 10px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", gap:7, transition:"all 0.15s", boxShadow: active ? `0 2px 12px rgba(0,75,135,0.12)` : "none" }}>
                {TabIcons[tab.id](active ? H.blue : H.textMid)}
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500, color: active ? H.blue : H.textMid, textAlign:"center", lineHeight:1.2 }}>{tab.label}</span>
                {tab.done && <span style={{ width:6, height:6, borderRadius:"50%", background: H.green, display:"block" }} />}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ background:H.card2, borderTop:`1px solid ${H.border}`, padding:"22px 26px 26px" }}>

          {/* ── PRESUPUESTO ── */}
          {activeBlock === "presupuesto" && (
            <div>
              <p style={{ fontSize:12, color:H.textMid, marginBottom:16, lineHeight:1.5 }}>{t("imp_ppto_sub")}</p>
              <UploadZone
                id="excel-input-ppto"
                loading={loadingPpto} resultado={resultadoPpto ? true : null} error={errorPpto}
                progreso={progresoPpto} progresoPct={progresoPctPpto}
                onFile={procesarPresupuesto}
                okContent={<p style={{ color:H.green, fontSize:12 }}>✓ {resultadoPpto?.presupuesto} {t("meses_presupuesto")}</p>}
              />
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          {activeBlock === "historico" && (
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:H.text, marginBottom:3 }}>Carga inicial</p>
              <p style={{ fontSize:12, color:H.textMid, marginBottom:14, lineHeight:1.5 }}>Importa todos los datos históricos de producción diaria y reservas OTB desde el Excel.</p>
              <UploadZone
                id="excel-input-main"
                loading={loadingMain} resultado={resultadoMain ? true : null} error={errorMain}
                progreso={progresoMain} progresoPct={progresoPctMain}
                onFile={procesarPrincipal}
                okContent={<>
                  <p style={{ color:H.green, fontSize:12 }}>✓ {resultadoMain?.produccion} {t("dias_produccion")}</p>
                  {resultadoMain?.pickup > 0 && <p style={{ color:H.green, fontSize:12, marginTop:3 }}>{resultadoMain?.pickup} {t("reservas_pickup")}</p>}
                </>}
              />
              <div style={{ marginTop:22, paddingTop:18, borderTop:`1px solid ${H.border}` }}>
                <p style={{ fontSize:11, fontWeight:700, color:H.text, marginBottom:3 }}>Editar día</p>
                <p style={{ fontSize:12, color:H.textMid, marginBottom:12 }}>Busca una fecha para corregir los datos de ese día.</p>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <input type="date" value={fechaBusqueda}
                    onChange={e => { setFechaBusqueda(e.target.value); setDiaEncontrado(null); setOkEdit(false); setErrorEdit(""); }}
                    style={{ flex:1, padding:"8px 10px", border:`1px solid ${H.border}`, borderRadius:6, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", background:H.card2, color:H.text, outline:"none" }}
                  />
                  <button onClick={buscarDia} disabled={buscando || !fechaBusqueda}
                    style={{ padding:"8px 18px", background:H.blue, color:"#fff", border:"none", borderRadius:6, fontSize:12, fontWeight:600, cursor:buscando||!fechaBusqueda?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:!fechaBusqueda?0.4:1 }}>
                    {buscando ? "…" : "Buscar"}
                  </button>
                </div>
                {errorEdit && !diaEncontrado && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorEdit}</p>}
                {diaEncontrado && (
                  <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:12 }}>
                      {[
                        { label:"Hab. Ocupadas",       key:"hab_ocupadas" },
                        { label:"Hab. Disponibles",    key:"hab_disponibles" },
                        { label:"Rev. Habitaciones €", key:"revenue_hab" },
                        { label:"Rev. Total €",        key:"revenue_total" },
                        { label:"Rev. F&B €",          key:"revenue_fnb" },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <label style={labelStyle}>{label}</label>
                          <input type="number" value={editValues[key]}
                            onChange={e => setEditValues(v => ({...v, [key]: e.target.value}))}
                            style={inputStyle} />
                        </div>
                      ))}
                    </div>
                    {okEdit && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Datos guardados</p>}
                    {errorEdit && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorEdit}</p>}
                    <button onClick={guardarDia} disabled={guardandoEdit}
                      style={{ width:"100%", padding:"9px", background:H.blue, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:guardandoEdit?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {guardandoEdit ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRODUCCIÓN DIARIA ── */}
          {activeBlock === "produccion" && (
            <div>
              <p style={{ fontSize:12, color:H.textMid, marginBottom:16, lineHeight:1.5 }}>Introduce la producción del día. Si ya existe registro para esa fecha, se actualizará.</p>
              <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"16px", marginBottom:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px", marginBottom:14 }}>
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={labelStyle}>Fecha</label>
                    <input type="date" value={prodForm.fecha}
                      onChange={e => setProdForm(f=>({...f, fecha:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Hab. Ocupadas</label>
                    <input type="number" min="0" value={prodForm.hab_ocupadas} placeholder="0"
                      onChange={e => setProdForm(f=>({...f, hab_ocupadas:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Hab. Disponibles</label>
                    <input type="number" min="0" value={prodForm.hab_disponibles} placeholder="0"
                      onChange={e => setProdForm(f=>({...f, hab_disponibles:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Rev. Habitaciones €</label>
                    <input type="number" min="0" step="0.01" value={prodForm.revenue_hab} placeholder="0.00"
                      onChange={e => setProdForm(f=>({...f, revenue_hab:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Rev. Total €</label>
                    <input type="number" min="0" step="0.01" value={prodForm.revenue_total} placeholder="0.00"
                      onChange={e => setProdForm(f=>({...f, revenue_total:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Rev. F&B €</label>
                    <input type="number" min="0" step="0.01" value={prodForm.revenue_fnb} placeholder="0.00"
                      onChange={e => setProdForm(f=>({...f, revenue_fnb:e.target.value}))} style={inputStyle} />
                  </div>
                  {(prodForm.hab_ocupadas || prodForm.revenue_hab) && (() => {
                    const ho = parseFloat(prodForm.hab_ocupadas) || 0;
                    const hd = parseFloat(prodForm.hab_disponibles) || 0;
                    const rh = parseFloat(prodForm.revenue_hab) || 0;
                    const adr    = ho > 0 ? Math.round(rh / ho * 100) / 100 : null;
                    const revpar = hd > 0 ? Math.round(rh / hd * 100) / 100 : null;
                    const occ    = hd > 0 ? Math.round(ho / hd * 1000) / 10 : null;
                    return (
                      <div style={{ gridColumn:"1 / -1", display:"flex", gap:8 }}>
                        {[["OCC", occ!=null?`${occ}%`:"—"], ["ADR", adr!=null?`€${adr}`:"—"], ["RevPAR", revpar!=null?`€${revpar}`:"—"]].map(([k,v]) => (
                          <div key={k} style={{ flex:1, background:H.bg, border:`1px solid ${H.border}`, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                            <p style={{ fontSize:9, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:3 }}>{k}</p>
                            <p style={{ fontSize:16, fontWeight:700, color:H.accent, fontFamily:"'Cormorant Garamond',serif" }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {errorProd && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorProd}</p>}
                {okProd && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Producción guardada</p>}
                <button onClick={guardarProduccion} disabled={guardandoProd}
                  style={{ width:"100%", padding:"10px", background:H.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:guardandoProd?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {guardandoProd ? "Guardando…" : "Guardar producción"}
                </button>
              </div>
              {prodRecientes.length > 0 && (
                <div>
                  <p style={{ fontSize:10, color:H.textMid, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.8px" }}>Guardados esta sesión</p>
                  <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:8, overflow:"hidden" }}>
                    {prodRecientes.map((r, i) => {
                      const ho = r.hab_ocupadas || 0; const hd = r.hab_disponibles || 0;
                      const occ = hd > 0 ? (ho/hd*100).toFixed(1) : "—";
                      const adr = ho > 0 && r.revenue_hab ? Math.round(r.revenue_hab/ho) : "—";
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom: i < prodRecientes.length-1 ? `1px solid ${H.border}` : "none", fontSize:12 }}>
                          <span style={{ color:H.text, fontWeight:600, minWidth:90 }}>{r.fecha}</span>
                          <span style={{ color:H.textMid }}>{ho} hab.</span>
                          <span style={{ color:H.accent, fontWeight:600 }}>{occ !== "—" ? `${occ}%` : "—"}</span>
                          <span style={{ color:H.textMid }}>ADR {adr !== "—" ? `€${adr}` : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PICK UP ── */}
          {activeBlock === "pickup" && (
            <div>
              <p style={{ fontSize:12, color:H.textMid, marginBottom:16, lineHeight:1.5 }}>Añade el pick up diario de reservas en el mismo formato que el Excel.</p>
              <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"16px", marginBottom:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px", marginBottom:14 }}>
                  <div>
                    <label style={labelStyle}>Fecha Pick Up</label>
                    <input type="date" value={pickupForm.fecha_pickup}
                      onChange={e => setPickupForm(f=>({...f, fecha_pickup:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha Llegada *</label>
                    <input type="date" value={pickupForm.fecha_llegada}
                      onChange={e => setPickupForm(f=>({...f, fecha_llegada:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Canal</label>
                    <input type="text" value={pickupForm.canal} placeholder="Booking.com, Directo…"
                      onChange={e => setPickupForm(f=>({...f, canal:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nº Reservas</label>
                    <input type="number" min="1" value={pickupForm.num_reservas}
                      onChange={e => setPickupForm(f=>({...f, num_reservas:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha Salida</label>
                    <input type="date" value={pickupForm.fecha_salida}
                      onChange={e => setPickupForm(f=>({...f, fecha_salida:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Noches</label>
                    <input type="number" min="1" value={pickupForm.noches} placeholder="—"
                      onChange={e => setPickupForm(f=>({...f, noches:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Precio Total €</label>
                    <input type="number" step="0.01" value={pickupForm.precio_total} placeholder="—"
                      onChange={e => setPickupForm(f=>({...f, precio_total:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select value={pickupForm.estado}
                      onChange={e => setPickupForm(f=>({...f, estado:e.target.value}))}
                      style={{...inputStyle, cursor:"pointer"}}>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
                {errorPickup && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorPickup}</p>}
                {okPickup && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Reserva añadida</p>}
                <button onClick={guardarPickup} disabled={guardandoPickup}
                  style={{ width:"100%", padding:"10px", background:H.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:guardandoPickup?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {guardandoPickup ? "Guardando…" : "Añadir reserva"}
                </button>
              </div>
              {pickupRecientes.length > 0 && (
                <div>
                  <p style={{ fontSize:10, color:H.textMid, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.8px" }}>Añadidas esta sesión</p>
                  <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:8, overflow:"hidden" }}>
                    {pickupRecientes.map((r, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom: i < pickupRecientes.length-1 ? `1px solid ${H.border}` : "none", fontSize:12 }}>
                        <span style={{ color:H.text, minWidth:80 }}>{r.fecha_llegada}</span>
                        <span style={{ color:H.textMid, flex:1, paddingLeft:8 }}>{r.canal || "—"}</span>
                        <span style={{ color:H.textMid, marginRight:10 }}>{r.num_reservas} hab.</span>
                        <span style={{ color: r.estado==="cancelada" ? H.red : H.green, fontSize:11, fontWeight:600 }}>{r.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ver dashboard */}
          {(resultadoMain || resultadoPpto || prodRecientes.length > 0 || pickupRecientes.length > 0) && (
            <button onClick={onClose} style={{ width:"100%", marginTop:20, marginBottom:10, background:H.accent, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:`0 4px 20px rgba(200,147,58,0.35)` }}>
              {t("ver_dashboard")}
            </button>
          )}

          {/* Vaciar datos */}
          {confirmVaciar ? (
            <div style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:8, padding:"14px", textAlign:"center", marginTop:8 }}>
              <p style={{ fontWeight:700, color:H.red, marginBottom:4, fontSize:13 }}>{t("vaciar_confirm")}</p>
              <p style={{ fontSize:11, color:H.textMid, marginBottom:10 }}>{t("vaciar_desc")}</p>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                <button onClick={()=>setConfirmVaciar(false)} style={{ padding:"6px 16px", borderRadius:7, border:`1px solid ${H.border}`, background:H.card2, color:H.textMid, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11 }}>{t("cancelar")}</button>
                <button onClick={vaciarDatos} disabled={vaciando} style={{ padding:"6px 16px", borderRadius:7, border:"none", background:H.red, color:"#fff", cursor:vaciando?"not-allowed":"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11 }}>{vaciando?t("vaciando"):t("si_vaciar")}</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setConfirmVaciar(true)} style={{ width:"100%", padding:"7px", borderRadius:7, border:"1px solid rgba(231,76,60,0.2)", background:"none", color:"rgba(231,76,60,0.6)", cursor:"pointer", fontSize:11, fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:8 }}>
              {t("vaciar_datos")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── MONTH DETAIL VIEW ───────────────────────────────────────────
function MonthDetailView({ datos, mes, anio, onBack }) {
  const t = useT();
  const { produccion } = datos;
  const [notasDia, setNotasDia] = useState(() => { try { return JSON.parse(localStorage.getItem("fr_notas_dia")||"{}"); } catch { return {}; } });
  const [editingNotaDia, setEditingNotaDia] = useState(null);
  const guardarNotaDia = (key, txt) => { const n={...notasDia,[key]:txt}; setNotasDia(n); localStorage.setItem("fr_notas_dia",JSON.stringify(n)); };

  const datosMes = (produccion || []).filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mes && f.getFullYear() === anio;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const totalHabOcu = datosMes.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const totalHabDis = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const totalRevHab = datosMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const totalRevTot = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const mediaOcc    = totalHabDis > 0 ? (totalHabOcu / totalHabDis * 100).toFixed(1) : 0;
  const mediaAdr    = totalHabOcu > 0 ? Math.round(totalRevHab / totalHabOcu) : 0;
  const mediaRevpar = totalHabDis > 0 ? Math.round(totalRevHab / totalHabDis) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: C.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          {t("volver")}
        </button>
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
            {t("detalle_diario")} — {t("meses_corto")[mes]} {anio}
          </h2>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{datosMes.length} {t("dias_con_datos")}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: t("th_ocup_media"), value: `${mediaOcc}%` },
          { label: t("th_adr_medio"),  value: `€${mediaAdr}` },
          { label: t("th_revpar_medio"), value: `€${mediaRevpar}` },
          { label: t("th_rev_hab_total"), value: `€${Math.round(totalRevHab).toLocaleString("es-ES")}` },
          { label: t("th_rev_total"),  value: `€${Math.round(totalRevTot).toLocaleString("es-ES")}` },
        ].map((k, i) => (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", borderTop: `3px solid ${C.accent}` }}>
            <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>{k.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: C.text, marginTop: 6 }}>{k.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {[t("th_fecha"), "Notas", t("th_hab_ocup"), t("th_ocup"), t("th_adr"), t("th_revpar"), t("th_rev_hab"), t("th_rev_total")].map((h,hi) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: hi<=1 ? "left" : "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosMes.map((d, i) => {
                const fecha   = new Date(d.fecha + "T00:00:00");
                const dia     = fecha.getDate();
                const semana  = t("dias_abrev")[fecha.getDay()];
                const habDis  = d.hab_disponibles || 30;
                const occ     = habDis > 0 ? (d.hab_ocupadas / habDis * 100).toFixed(1) : 0;
                const adr     = d.hab_ocupadas > 0 ? Math.round(d.revenue_hab / d.hab_ocupadas) : 0;
                const revpar  = habDis > 0 ? Math.round(d.revenue_hab / habDis) : 0;
                const esFinSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: esFinSemana ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard) }}>
                    <td style={{ padding: "9px 14px", color: C.text, fontWeight: esFinSemana ? 600 : 400 }}>
                      <span style={{ color: C.textLight, fontSize: 11, marginRight: 6 }}>{semana}</span>
                      {String(dia).padStart(2, "0")}/{String(mes + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "9px 14px" }} onClick={e=>e.stopPropagation()}>
                      {editingNotaDia === d.fecha ? (
                        <input autoFocus defaultValue={notasDia[d.fecha]||""} onBlur={e=>{ guardarNotaDia(d.fecha,e.target.value); setEditingNotaDia(null); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape"){ guardarNotaDia(d.fecha,e.target.value); setEditingNotaDia(null); } }} style={{ width:120, fontSize:12, padding:"3px 6px", borderRadius:4, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontFamily:"inherit", outline:"none" }}/>
                      ) : (
                        <span onClick={()=>setEditingNotaDia(d.fecha)} style={{ fontSize:12, color:notasDia[d.fecha]?C.textMid:C.border, cursor:"text", display:"inline-block", minWidth:80, padding:"2px 4px", borderRadius:4, border:`1px dashed ${C.border}` }}>
                          {notasDia[d.fecha]||"—"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>{d.hab_ocupadas}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: parseFloat(occ) >= 80 ? C.green : parseFloat(occ) < 50 ? C.red : C.textMid, fontWeight: 600 }}>{occ}%</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{adr}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.accent, fontWeight: 600 }}>€{revpar}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revenue_hab).toLocaleString("es-ES")}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revenue_total || 0).toLocaleString("es-ES")}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.border}`, background: "#E8F5EE", fontWeight: 700 }}>
                <td style={{ padding: "10px 14px", color: C.text, fontWeight: 700 }}>{t("total_mes")}</td>
                <td/>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>{totalHabOcu}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>{mediaOcc}%</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>€{mediaAdr}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.accent }}>€{mediaRevpar}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>€{Math.round(totalRevHab).toLocaleString("es-ES")}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>€{Math.round(totalRevTot).toLocaleString("es-ES")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}


// ─── PDF REPORT ──────────────────────────────────────────────────


async function generarReportePDF(datos, mes, anio, hotelNombre, returnData = false) {
  const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MESES_C    = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const { produccion, presupuesto } = datos;
  const fmt  = n => n != null ? Math.round(n).toLocaleString("es-ES") : "—";
  const fmtP = n => n != null ? parseFloat(n).toFixed(1) + "%" : "—";

  const getMes = (mIdx, aIdx) => {
    const d = (produccion||[]).filter(r => {
      const f = new Date(r.fecha+"T00:00:00");
      return f.getMonth()===mIdx && f.getFullYear()===aIdx;
    });
    const habOcu = d.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
    const habDis = d.reduce((a,r)=>a+(r.hab_disponibles||0),0);
    const revH   = d.reduce((a,r)=>a+(r.revenue_hab||0),0);
    const revFnb = d.reduce((a,r)=>a+(r.revenue_fnb||0),0);
    const revTot = d.reduce((a,r)=>a+(r.revenue_total||0),0);
    return { d, habOcu, habDis, revH, revFnb, revTot,
      occ:    habDis>0 ? (habOcu/habDis*100) : 0,
      adr:    habOcu>0 ? revH/habOcu : 0,
      revpar: habDis>0 ? revH/habDis : 0,
      trevpar:habDis>0 ? (revH+revFnb)/habDis : 0,
    };
  };

  const mesAct = getMes(mes, anio);
  const mesPrev = getMes(mes===0?11:mes-1, mes===0?anio-1:anio);

  const rodantes = Array.from({length:12},(_,i)=>{
    const total = mes-11+i;
    const mIdx  = ((total%12)+12)%12;
    const aIdx  = anio + Math.floor(total/12);
    const md = getMes(mIdx, aIdx);
    const pp = (presupuesto||[]).find(p=>p.mes===mIdx+1 && p.anio===aIdx);
    return { mes: MESES_C[mIdx], anio: aIdx, ...md, ppto: pp };
  }).filter(r=>r.habOcu>0||r.revTot>0);

  const diasMes = mesAct.d.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).map(d=>{
    const f = new Date(d.fecha+"T00:00:00");
    const habDis = d.hab_disponibles||30;
    return {
      dia:   f.getDate(),
      sem:   ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][f.getDay()],
      occ:   habDis>0?(d.hab_ocupadas/habDis*100).toFixed(1):0,
      adr:   d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
      revpar:habDis>0?Math.round(d.revenue_hab/habDis):0,
      revTot:Math.round(d.revenue_total||0),
    };
  });

  const pptoMes = (presupuesto||[]).find(p=>p.mes===mes+1 && p.anio===anio);
  const pptoVsReal = pptoMes ? {
    occ:   pptoMes.occ_ppto       ? (mesAct.occ    - pptoMes.occ_ppto).toFixed(1)                                : null,
    adr:   pptoMes.adr_ppto       ? ((mesAct.adr    - pptoMes.adr_ppto)   / pptoMes.adr_ppto   * 100).toFixed(1) : null,
    revpar:pptoMes.revpar_ppto     ? ((mesAct.revpar  - pptoMes.revpar_ppto)/ pptoMes.revpar_ppto * 100).toFixed(1) : null,
    rev:   pptoMes.rev_total_ppto  ? ((mesAct.revTot - pptoMes.rev_total_ppto)/pptoMes.rev_total_ppto*100).toFixed(1) : null,
  } : null;

  const diffPct = (curr, prev) => prev > 0 ? ((curr-prev)/prev*100).toFixed(1) : null;
  const occDiff  = diffPct(mesAct.occ, mesPrev.occ);
  const adrDiff  = diffPct(mesAct.adr, mesPrev.adr);
  const revDiff  = diffPct(mesAct.revTot, mesPrev.revTot);
  const tendOcc  = occDiff  ? (parseFloat(occDiff)>=0  ? `subió un ${occDiff}%`  : `bajó un ${Math.abs(occDiff)}%`)  : "sin comparativa";
  const tendAdr  = adrDiff  ? (parseFloat(adrDiff)>=0  ? `subió un ${adrDiff}%`  : `bajó un ${Math.abs(adrDiff)}%`)  : "sin comparativa";
  const tendRev  = revDiff  ? (parseFloat(revDiff)>=0  ? `aumentó un ${revDiff}%` : `cayó un ${Math.abs(revDiff)}%`) : "sin comparativa";
  const mejorDia = diasMes.length>0 ? diasMes.reduce((a,b)=>parseFloat(a.occ)>parseFloat(b.occ)?a:b) : null;
  const peorDia  = diasMes.length>0 ? diasMes.reduce((a,b)=>parseFloat(a.occ)<parseFloat(b.occ)?a:b) : null;
  const pptoOk   = pptoVsReal?.rev ? parseFloat(pptoVsReal.rev) >= 0 : null;

  const resumenIA = [
    `El mes de ${MESES_FULL[mes]} ${anio} cerró con una ocupación del ${mesAct.occ.toFixed(1)}%, un ADR de €${Math.round(mesAct.adr)} y un RevPAR de €${Math.round(mesAct.revpar)}, generando un revenue total de €${fmt(mesAct.revTot)}. Respecto al mes anterior, la ocupación ${tendOcc}, el ADR ${tendAdr} y el revenue ${tendRev}.`,
    pptoVsReal ? `En cuanto al cumplimiento presupuestario, el revenue total ${pptoOk?"superó":"no alcanzó"} el objetivo con una desviación del ${pptoVsReal.rev}%.${pptoVsReal.occ ? ` La ocupación se situó ${parseFloat(pptoVsReal.occ)>=0?"por encima":"por debajo"} del objetivo en ${Math.abs(pptoVsReal.occ)} pp.` : ""} El ADR ${parseFloat(pptoVsReal.adr)>=0?"superó":"estuvo por debajo de"} el presupuesto en un ${Math.abs(pptoVsReal.adr)}% y el RevPAR se desvió un ${pptoVsReal.revpar}% respecto al objetivo.` : `No se dispone de datos presupuestarios para este mes, por lo que no es posible realizar la comparativa vs objetivo.`,
    mejorDia && peorDia ? `El día de mayor ocupación fue el ${mejorDia.dia} con un ${mejorDia.occ}% de ocupación y un ADR de €${mejorDia.adr}. Por el contrario, el día más débil fue el ${peorDia.dia} con un ${peorDia.occ}% de ocupación, lo que sugiere oportunidades de mejora en la captación de demanda en esos períodos.` : "",
    `El TRevPAR del mes se situó en €${Math.round(mesAct.trevpar)}, con los ingresos de habitaciones representando el grueso del revenue total. Para el próximo mes se recomienda ${mesAct.occ < 70 ? "reforzar la estrategia de captación y revisar la política de precios para mejorar la ocupación" : mesAct.adr < mesPrev.adr ? "mantener la ocupación alcanzada y trabajar en incrementar el ADR mediante upselling y segmentación de tarifas" : "consolidar la estrategia actual que está mostrando resultados positivos tanto en ocupación como en precio medio"}.`
  ].filter(Boolean).join("\n\n");

  const loadScript = (src) => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W=210; const M=14; let y=M;

  const azul   = [0,75,135];
  const negro  = [26,26,26];
  const gris   = [100,100,100];
  const grisCl = [220,220,220];
  const verde  = [0,159,77];
  const rojo   = [211,47,47];

  const addPage = () => { doc.addPage(); y=M; };
  const checkY  = (needed=20) => { if(y+needed>285) addPage(); };

  doc.setFillColor(...azul);
  doc.rect(0,0,W,38,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(22); doc.setFont("helvetica","bold");
  doc.text((hotelNombre||"Mi Hotel").toUpperCase(), M, 18);
  doc.setFontSize(13); doc.setFont("helvetica","normal");
  doc.text(`Informe Mensual — ${MESES_FULL[mes]} ${anio}`, M, 28);
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"})}`, W-M, 33, {align:"right"});
  y = 48;

  doc.setTextColor(...azul);
  doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("KPIs del Mes", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M, y, W-M, y); y+=5;

  const kpis = [
    ["Ocupación", fmtP(mesAct.occ), "Mes anterior: "+fmtP(mesPrev.occ)],
    ["ADR", "€"+fmt(mesAct.adr), "Mes anterior: €"+fmt(mesPrev.adr)],
    ["RevPAR", "€"+fmt(mesAct.revpar), "Mes anterior: €"+fmt(mesPrev.revpar)],
    ["TRevPAR", "€"+fmt(mesAct.trevpar), ""],
    ["Revenue Hab.", "€"+fmt(mesAct.revH), ""],
    ["Revenue Total", "€"+fmt(mesAct.revTot), pptoVsReal?.rev ? `vs Ppto: ${pptoVsReal.rev}%` : ""],
  ];
  const colW = (W-M*2)/3;
  kpis.forEach((k,i)=>{
    const col = i%3; const row = Math.floor(i/3);
    const x = M + col*colW; const ky = y + row*22;
    doc.setFillColor(248,250,253);
    doc.roundedRect(x+1, ky, colW-3, 18, 2, 2, "F");
    doc.setDrawColor(...grisCl); doc.roundedRect(x+1, ky, colW-3, 18, 2, 2, "S");
    doc.setTextColor(...gris); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(k[0].toUpperCase(), x+5, ky+5);
    doc.setTextColor(...negro); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text(k[1], x+5, ky+12);
    if(k[2]){ doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...gris); doc.text(k[2], x+5, ky+16.5); }
  });
  y += 48;

  if(pptoVsReal) {
    checkY(30);
    doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text("Comparativa vs Presupuesto", M, y); y+=6;
    doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=5;
    doc.autoTable({
      startY: y,
      head: [["Métrica","Presupuesto","Real","Desviación"]],
      body: [
        ["Ocupación", pptoMes?.occ_ppto?fmtP(pptoMes.occ_ppto):"—", fmtP(mesAct.occ), pptoVsReal.occ?(parseFloat(pptoVsReal.occ)>=0?"+":"")+pptoVsReal.occ+" pp":"—"],
        ["ADR", pptoMes?.adr_ppto?"€"+fmt(pptoMes.adr_ppto):"—", "€"+fmt(mesAct.adr), pptoVsReal.adr?(parseFloat(pptoVsReal.adr)>=0?"+":"")+pptoVsReal.adr+"%":"—"],
        ["RevPAR", pptoMes?.revpar_ppto?"€"+fmt(pptoMes.revpar_ppto):"—", "€"+fmt(mesAct.revpar), pptoVsReal.revpar?(parseFloat(pptoVsReal.revpar)>=0?"+":"")+pptoVsReal.revpar+"%":"—"],
        ["Revenue Total", pptoMes?.rev_total_ppto?"€"+fmt(pptoMes.rev_total_ppto):"—", "€"+fmt(mesAct.revTot), pptoVsReal.rev?(parseFloat(pptoVsReal.rev)>=0?"+":"")+pptoVsReal.rev+"%":"—"],
      ],
      styles: { fontSize:9, cellPadding:3 },
      headStyles: { fillColor:azul, textColor:[255,255,255], fontStyle:"bold" },
      alternateRowStyles: { fillColor:[248,250,253] },
      columnStyles: { 3: { halign:"center", fontStyle:"bold" } },
      margin: { left:M, right:M },
      didParseCell: (d)=>{
        if(d.section==="body" && d.column.index===3 && d.cell.raw!=="—"){
          d.cell.styles.textColor = parseFloat(d.cell.raw)>=0 ? verde : rojo;
        }
      }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  checkY(40);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Análisis IA del Mes", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=5;
  doc.setFillColor(248,250,253);
  const lines = doc.splitTextToSize(resumenIA, W-M*2-8);
  doc.roundedRect(M, y, W-M*2, lines.length*4.5+8, 2, 2, "F");
  doc.setTextColor(...negro); doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text(lines, M+4, y+6);
  y += lines.length*4.5+14;

  checkY(60);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Resumen Últimos 12 Meses", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=3;
  doc.autoTable({
    startY: y,
    head: [["Mes","Ocup.","ADR","RevPAR","TRevPAR","Rev. Hab.","Rev. Total"]],
    body: rodantes.map(r=>[
      r.mes+(r.anio!==anio?" "+r.anio:""),
      fmtP(r.occ), "€"+fmt(r.adr), "€"+fmt(r.revpar),
      "€"+fmt(r.trevpar), "€"+fmt(r.revH), "€"+fmt(r.revTot)
    ]),
    styles: { fontSize:8.5, cellPadding:2.5 },
    headStyles: { fillColor:azul, textColor:[255,255,255], fontStyle:"bold" },
    alternateRowStyles: { fillColor:[248,250,253] },
    margin: { left:M, right:M },
  });
  y = doc.lastAutoTable.finalY + 10;

  checkY(20);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text(`Detalle Diario — ${MESES_FULL[mes]} ${anio}`, M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=3;
  doc.autoTable({
    startY: y,
    head: [["Día","","Ocup.","ADR","RevPAR","Rev. Total"]],
    body: diasMes.map(d=>[d.dia, d.sem, d.occ+"%", "€"+d.adr, "€"+d.revpar, "€"+fmt(d.revTot)]),
    styles: { fontSize:8, cellPadding:2 },
    headStyles: { fillColor:azul, textColor:[255,255,255], fontStyle:"bold" },
    alternateRowStyles: { fillColor:[248,250,253] },
    columnStyles: { 1:{ textColor:gris, fontStyle:"italic" } },
    margin: { left:M, right:M },
    didParseCell: (d)=>{
      if(d.section==="body" && d.column.index===2){
        const v = parseFloat(d.cell.raw);
        d.cell.styles.textColor = v>=80?verde:v<50?rojo:negro;
        d.cell.styles.fontStyle = "bold";
      }
    }
  });

  // ── GRÁFICA OCUPACIÓN DIARIA (barras) ──
  addPage();
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text(`Evolución Diaria — Ocupación & ADR`, M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=6;

  if(diasMes.length > 0) {
    const chartW = W-M*2;
    const chartH = 45;
    const barW = Math.min(6, chartW/diasMes.length - 1);
    const gap = chartW/diasMes.length;
    const maxOcc = 100;
    const maxAdr = Math.max(...diasMes.map(d=>d.adr)) * 1.15;

    // Fondo gráfica
    doc.setFillColor(248,250,253);
    doc.rect(M, y, chartW, chartH, "F");
    doc.setDrawColor(...grisCl);
    doc.rect(M, y, chartW, chartH, "S");

    // Líneas guía horizontales
    [25,50,75,100].forEach(pct => {
      const ly = y + chartH - (pct/maxOcc)*chartH;
      doc.setDrawColor(220,220,220); doc.setLineWidth(0.1);
      doc.line(M, ly, M+chartW, ly);
      doc.setTextColor(...gris); doc.setFontSize(5);
      doc.text(pct+"%", M-4, ly+1, {align:"right"});
    });

    // Barras ocupación
    diasMes.forEach((d,i) => {
      const bx = M + i*gap + gap/2 - barW/2;
      const bh = (parseFloat(d.occ)/maxOcc) * chartH;
      const by = y + chartH - bh;
      const color = parseFloat(d.occ)>=80 ? verde : parseFloat(d.occ)<50 ? rojo : azul;
      doc.setFillColor(...color);
      doc.rect(bx, by, barW, bh, "F");
    });

    // Línea ADR
    doc.setDrawColor(232,93,4); doc.setLineWidth(0.6);
    diasMes.forEach((d,i) => {
      if(i===0) return;
      const x1 = M + (i-1)*gap + gap/2;
      const x2 = M + i*gap + gap/2;
      const y1 = y + chartH - (diasMes[i-1].adr/maxAdr)*chartH;
      const y2 = y + chartH - (d.adr/maxAdr)*chartH;
      doc.line(x1, y1, x2, y2);
    });

    // Eje X días
    doc.setTextColor(...gris); doc.setFontSize(5);
    diasMes.forEach((d,i) => {
      if(i%5===0 || i===diasMes.length-1) {
        doc.text(String(d.dia), M+i*gap+gap/2, y+chartH+4, {align:"center"});
      }
    });

    // Leyenda
    doc.setFillColor(...azul); doc.rect(M, y+chartH+7, 8, 3, "F");
    doc.setTextColor(...negro); doc.setFontSize(7);
    doc.text("Ocupación %", M+10, y+chartH+10);
    doc.setDrawColor(232,93,4); doc.setLineWidth(0.8);
    doc.line(M+45, y+chartH+8.5, M+53, y+chartH+8.5);
    doc.text("ADR €", M+55, y+chartH+10);

    y += chartH + 18;
  }

  // ── GRÁFICA OCUPACIÓN POR DÍA DE SEMANA ──
  checkY(65);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Ocupación Media por Día de Semana", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=6;

  if(diasMes.length > 0) {
    const diasSem = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
    const ocpSem = diasSem.map(ds => {
      const dias = diasMes.filter(d=>d.sem===ds);
      return dias.length>0 ? dias.reduce((a,d)=>a+parseFloat(d.occ),0)/dias.length : 0;
    });
    const chartW = W-M*2;
    const chartH = 35;
    const barW = 18;
    const gap = chartW/7;

    doc.setFillColor(248,250,253);
    doc.rect(M, y, chartW, chartH, "F");
    doc.setDrawColor(...grisCl); doc.rect(M, y, chartW, chartH, "S");

    ocpSem.forEach((occ,i) => {
      const bx = M + i*gap + gap/2 - barW/2;
      const bh = (occ/100)*chartH;
      const by = y + chartH - bh;
      const color = occ>=80 ? verde : occ<50 ? rojo : azul;
      doc.setFillColor(...color);
      doc.rect(bx, by, barW, bh, "F");
      doc.setTextColor(...negro); doc.setFontSize(7); doc.setFont("helvetica","bold");
      if(occ>0) doc.text(occ.toFixed(0)+"%", bx+barW/2, by-1.5, {align:"center"});
      doc.setFont("helvetica","normal"); doc.setTextColor(...gris); doc.setFontSize(8);
      doc.text(diasSem[i], bx+barW/2, y+chartH+5, {align:"center"});
    });
    y += chartH + 14;
  }

  // ── DISTRIBUCIÓN REVENUE ──
  checkY(45);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Distribución del Revenue", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=4;

  const revComponents = [
    { label:"Revenue Habitaciones", value:mesAct.revH, color:azul },
    { label:"Revenue F&B", value:mesAct.revFnb, color:[0,159,77] },
  ].filter(r=>r.value>0);

  if(revComponents.length>0) {
    const total = revComponents.reduce((a,r)=>a+r.value,0);
    const barTotalW = W-M*2;
    let bx = M;
    revComponents.forEach(r => {
      const bw = (r.value/total)*barTotalW;
      doc.setFillColor(...r.color);
      doc.rect(bx, y, bw, 10, "F");
      bx += bw;
    });
    y += 13;
    revComponents.forEach((r,i) => {
      const pct = (r.value/total*100).toFixed(1);
      doc.setFillColor(...r.color); doc.rect(M+i*65, y, 8, 4, "F");
      doc.setTextColor(...negro); doc.setFontSize(8);
      doc.text(`${r.label}: €${Math.round(r.value).toLocaleString("es-ES")} (${pct}%)`, M+i*65+10, y+3.5);
    });
    y += 12;
  }

  const pages = doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(...gris);
    doc.text(`${hotelNombre||"FastRev"} · Informe ${MESES_FULL[mes]} ${anio} · Página ${i} de ${pages}`, W/2, 292, {align:"center"});
  }

  if (returnData) {
    return doc.output('datauristring').split(',')[1];
  }
  doc.save(`Informe_${MESES_FULL[mes]}_${anio}.pdf`);
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────
function DashboardView({ datos, mes, anio, onPeriodo, onMesDetalle, kpiModal, setKpiModal, kpiModalExterno, onKpiModalExternoHandled }) {
  const t = useT();
  const { produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const presupuesto   = datos.presupuesto   || [];
  const [hmMesSel, setHmMesSel] = useState(null);
  const [modalDiario, setModalDiario] = useState(null); // {mesIdx, anioIdx}

  // ── Pickup del último día importado por mes de llegada ──
  const todasFechasPickup = pickupEntries
    .filter(e => !e._grupo)
    .map(e => String(e.fecha_pickup || '').slice(0,10))
    .filter(f => f.length === 10)
    .sort();
  const ultimoDiaImportado = todasFechasPickup[todasFechasPickup.length - 1] || '';
  const pickupUltimoDiaPorMes = {};
  const pickupUltimoDiaPorDia = {}; // { "2026-04-15": X, ... }
  pickupEntries.forEach(e => {
    const fp = String(e.fecha_pickup || '').slice(0,10);
    if (fp !== ultimoDiaImportado) return;
    const fl = String(e.fecha_llegada || '').slice(0,10);
    const flMes = fl.slice(0,7);
    if (!flMes) return;
    const cancelada = (e.estado || 'confirmada') === 'cancelada';
    const nr = (e.num_reservas || 1) * (cancelada ? -1 : 1);
    pickupUltimoDiaPorMes[flMes] = (pickupUltimoDiaPorMes[flMes] || 0) + nr;
    pickupUltimoDiaPorDia[fl]    = (pickupUltimoDiaPorDia[fl]    || 0) + nr;
  });
  // Los 2 meses con más reservas ese día
  const top2Meses = Object.entries(pickupUltimoDiaPorMes)
    .sort((a,b) => b[1]-a[1])
    .slice(0,2)
    .map(([mes]) => mes);
  const [metricaSel, setMetricaSel] = useState("adr_occ");
  const [notasMes, setNotasMes] = useState(() => { try { return JSON.parse(localStorage.getItem("fr_notas_mes")||"{}"); } catch { return {}; } });
  const [editingNota, setEditingNota] = useState(null);
  const guardarNota = (key, txt) => { const n={...notasMes,[key]:txt}; setNotasMes(n); localStorage.setItem("fr_notas_mes",JSON.stringify(n)); };
  const [hmDragStart,  setHmDragStart]  = useState(null);
  const [hmDragEnd,    setHmDragEnd]    = useState(null);
  const [hmIsDragging, setHmIsDragging] = useState(false);
  const [hmEventForm,  setHmEventForm]  = useState(null); // {fromISO, toISO}
  const [hmEventEdit,  setHmEventEdit]  = useState({ title:"", color:"#3B82F6", notes:"" });
  const [hmEvents, setHmEvents] = useState(() => { try { return JSON.parse(localStorage.getItem("fr_hm_events")||"[]"); } catch { return []; } });
  const guardarHmEvent = (ev) => { const a=[...hmEvents,ev]; setHmEvents(a); localStorage.setItem("fr_hm_events",JSON.stringify(a)); };
  const borrarHmEvent  = (idx) => { const a=hmEvents.filter((_,i)=>i!==idx); setHmEvents(a); localStorage.setItem("fr_hm_events",JSON.stringify(a)); };
  useEffect(() => { setHmDragStart(null); setHmDragEnd(null); setHmIsDragging(false); }, [hmMesSel]);
  useEffect(() => {
    const up = () => { if (hmIsDragging) setHmIsDragging(false); };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [hmIsDragging]);
  useEffect(() => {
    if (kpiModalExterno) { setKpiModal(kpiModalExterno); onKpiModalExternoHandled && onKpiModalExternoHandled(); }
  }, [kpiModalExterno]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (hmEventForm) { setHmEventForm(null); return; }
      if (modalDiario) { setModalDiario(null); return; }
      if (hmMesSel !== null) { setHmMesSel(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalDiario, hmMesSel, hmEventForm]);

  if (!produccion || produccion.length === 0) return <EmptyState />;

  const datosMes = produccion.filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mes && f.getFullYear() === anio;
  });

  const totalHabOcupadas    = datosMes.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const totalHabDisponibles = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const totalRevHab   = datosMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const totalRevTotal = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const totalRevFnb   = datosMes.reduce((a, d) => a + (d.revenue_fnb || 0), 0);
  const occ     = totalHabDisponibles > 0 ? (totalHabOcupadas / totalHabDisponibles * 100).toFixed(1) : 0;
  const adr     = totalHabOcupadas > 0 ? (totalRevHab / totalHabOcupadas).toFixed(0) : 0;
  const revpar  = totalHabDisponibles > 0 ? (totalRevHab / totalHabDisponibles).toFixed(0) : 0;
  const trevpar = totalHabDisponibles > 0 ? ((totalRevHab + totalRevFnb) / totalHabDisponibles).toFixed(0) : 0;

  const porMes = Array.from({ length: 12 }, (_, i) => {
    const totalMeses = mes - 11 + i;
    const mIdx = ((totalMeses % 12) + 12) % 12;
    const aIdx = anio + Math.floor((mes - 11 + i) / 12);
    const d = produccion.filter(r => {
      const f = new Date(r.fecha + "T00:00:00");
      return f.getMonth() === mIdx && f.getFullYear() === aIdx;
    });
    const habOcu   = d.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const habDis   = d.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const revH     = d.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const revFnb   = d.reduce((a, r) => a + (r.revenue_fnb || 0), 0);
    return {
      mes: t("meses_corto")[mIdx],
      mesNombre: t("meses_full")[mIdx],
      mesIdx: mIdx,
      anioIdx: aIdx,
      occ:     habDis > 0 ? Math.round(habOcu / habDis * 100) : 0,
      adr:     habOcu > 0 ? Math.round(revH / habOcu) : 0,
      revpar:  habDis > 0 ? Math.round(revH / habDis) : 0,
      trevpar: habDis > 0 ? Math.round((revH + revFnb) / habDis) : 0,
      revHab:  Math.round(revH),
      revTotal: d.reduce((a,r) => a+(r.revenue_total||0), 0),
    };
  }).filter(d => d.occ > 0 || d.adr > 0);

  const hace30 = new Date(); hace30.setDate(hace30.getDate() - 29);
  const hace30Str = hace30.toISOString().slice(0,10);
  const datosDiariosMes = produccion
    .filter(d => d.fecha >= hace30Str)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .map(d => ({
      dia: new Date(d.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      fecha: new Date(d.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
      occ: d.hab_disponibles > 0 ? Math.round(d.hab_ocupadas / d.hab_disponibles * 100) : 0,
      adr: d.hab_ocupadas > 0 ? Math.round(d.revenue_hab / d.hab_ocupadas) : 0,
    }));

  const mesPrevIdx = mes === 0 ? 11 : mes - 1;
  const anioPrev   = mes === 0 ? anio - 1 : anio;
  const datosPrev  = produccion.filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mesPrevIdx && f.getFullYear() === anioPrev;
  });
  const prevHabOcu  = datosPrev.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const prevHabDis  = datosPrev.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const prevRevHab  = datosPrev.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const prevRevTot  = datosPrev.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const prevRevFnb  = datosPrev.reduce((a, d) => a + (d.revenue_fnb || 0), 0);
  const prevOcc     = prevHabDis > 0 ? (prevHabOcu / prevHabDis * 100) : null;
  const prevAdr     = prevHabOcu > 0 ? (prevRevHab / prevHabOcu) : null;
  const prevRevpar  = prevHabDis > 0 ? (prevRevHab / prevHabDis) : null;
  const prevTrevpar = prevHabDis > 0 ? ((prevRevHab + prevRevFnb) / prevHabDis) : null;

  // LY: mismo mes año anterior
  const datosMesLY = produccion.filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; });
  const lyHabOcuD  = datosMesLY.reduce((a,d)=>a+(d.hab_ocupadas||0),0);
  const lyHabDisD  = datosMesLY.reduce((a,d)=>a+(d.hab_disponibles||0),0);
  const lyRevHabD  = datosMesLY.reduce((a,d)=>a+(d.revenue_hab||0),0);
  const lyRevFnbD  = datosMesLY.reduce((a,d)=>a+(d.revenue_fnb||0),0);
  const lyRevTotD  = datosMesLY.reduce((a,d)=>a+(d.revenue_total||0),0);
  const lyOccD     = lyHabDisD>0?(lyHabOcuD/lyHabDisD*100):null;
  const lyAdrD     = lyHabOcuD>0?(lyRevHabD/lyHabOcuD):null;
  const lyRevparD  = lyHabDisD>0?(lyRevHabD/lyHabDisD):null;
  const lyTrevparD = lyHabDisD>0?((lyRevHabD+lyRevFnbD)/lyHabDisD):null;

  const diff = (curr, prevLm, prevLy) => {
    const badge = (prev) => {
      if (prev==null||prev===0) return { ch:"—", up:true };
      const d=curr-prev; return { ch:`${d>=0?"+":""}${((d/prev)*100).toFixed(1)}%`, up:d>=0 };
    };
    const lm=badge(prevLm), ly=badge(prevLy);
    return { changeLm:lm.ch, upLm:lm.up, changeLy:ly.ch, upLy:ly.up };
  };

  const kpis = [
    { label: t("kpi_ocupacion"), kpiKey:"Ocupación", value: `${occ}%`,     ...diff(parseFloat(occ), prevOcc, lyOccD) },
    { label: t("kpi_adr"),       kpiKey:"ADR",        value: `€${adr}`,    subtitle:"Precio medio",                    ...diff(parseFloat(adr), prevAdr, lyAdrD) },
    { label: t("kpi_revpar"),    kpiKey:"RevPAR",     value: `€${revpar}`, subtitle:"Revenue por hab. disponible",     ...diff(parseFloat(revpar), prevRevpar, lyRevparD) },
    { label: t("kpi_trevpar"),   kpiKey:"TRevPAR",    value: `€${trevpar}`,subtitle:"Revenue total por hab.",          ...diff(parseFloat(trevpar), prevTrevpar, lyTrevparD) },
  ];

  return (
    <div>
      {/* ── CABECERA MES ACTIVO ── */}
      <div className="dash-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <div>
          <p style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5, marginBottom:2 }}>
            {t("bienvenido")}, <span style={{ color:C.accent }}>{datos.hotel?.nombre || "Mi Hotel"}</span>
          </p>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:-0.5 }}>
              {t("meses_full")[mes]}
            </h2>
            <span style={{ fontSize:20, fontWeight:400, color:C.textLight }}>{anio}</span>
          </div>
        </div>
        <PeriodSelectorInline mes={mes} anio={anio} onChange={onPeriodo} aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()))].sort()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(140px,40vw,200px), 1fr))", gap: 10, marginBottom: 20 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} onClick={()=>setKpiModal(k.kpiKey)} />)}
      </div>


      {/* ── HEATMAP + GRÁFICAS ── */}
      {(() => {
        const MESES_H = t("meses_full");
        const DIAS_S  = t("dias_semana");
        // Ocupación por mes para el heatmap (real o OTB para futuros)
        const _pad = n => String(n).padStart(2,"0");
        const _hoy = new Date();
        const _hoyStr = `${_hoy.getFullYear()}-${_pad(_hoy.getMonth()+1)}-${_pad(_hoy.getDate())}`;
        const otbDia = {};
        (datos.pickupEntries||[]).forEach(e => {
          const f = String(e.fecha_llegada||"").slice(0,10);
          if (!f||f.length<10) return;
          otbDia[f] = (otbDia[f]||0)+(e.num_reservas||1);
        });
        const occPorMes = MESES_H.map((label, mi) => {
          const d = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio;
          });
          const habOcu = d.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDis = d.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          // Año anterior
          const dLY = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio-1;
          });
          const habOcuLY = dLY.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDisLY = dLY.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          const occLY = habDisLY>0 ? habOcuLY/habDisLY*100 : null;
          if (habDis>0) return { label, mi, occ: habOcu/habDis*100, occLY, esOtb: false };
          // Mes futuro: sumar reservas OTB del pickup
          const mesStr = `${anio}-${_pad(mi+1)}`;
          const diasMes = new Date(anio, mi+1, 0).getDate();
          const ultimoDia = `${mesStr}-${_pad(diasMes)}`;
          if (ultimoDia < _hoyStr) return { label, mi, occ: null, occLY, esOtb: false };
          // Calcular habH desde produccion si no viene del hotel
          const habFromProd = produccion.length > 0
            ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length)
            : 30;
          const habH = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
            ? datos.hotel.habitaciones
            : habFromProd;
          let totalRes = 0;
          for (let di=1; di<=diasMes; di++) {
            const iso = `${mesStr}-${_pad(di)}`;
            totalRes += otbDia[iso] || 0;
          }
          const occ = habH > 0 ? (totalRes / (habH * diasMes) * 100) : null;
          return { label, mi, occ: totalRes>0 ? occ : null, occLY, esOtb: true };
        });

        // Color heatmap — verde (baja) → amarillo → rojo (alta ocupación)
        const heatColor = (occ) => {
          if (occ==null) return C.border;
          if (occ<25)  return "#81C784";
          if (occ<40)  return "#4CAF50";
          if (occ<55)  return "#FFC107";
          if (occ<70)  return "#FF7043";
          if (occ<85)  return "#E53935";
          return "#B71C1C";
        };
        const heatBg = (occ) => occ!=null
          ? `linear-gradient(to bottom, ${heatColor(occ)}88, ${heatColor(occ)}33)`
          : C.bg;

        // Datos diarios del mes seleccionado (pasado=produccion, futuro=pickup)
        const habHotel = datos.hotel?.habitaciones ||
          (produccion.length > 0 ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length) : 30);
        const _hoy2 = new Date();
        const pad2  = n => String(n).padStart(2,"0");
        const hoyStr2 = `${_hoy2.getFullYear()}-${pad2(_hoy2.getMonth()+1)}-${pad2(_hoy2.getDate())}`;


        // Neto acumulado por día para meses futuros (confirmadas - canceladas)
        const netoPorDia = {};
        if (hmMesSel != null) {
          const padM = n => String(n).padStart(2,"0");
          const mesStr = `${anio}-${padM(hmMesSel+1)}`;
          pickupEntries.forEach(e => {
            const fl = String(e.fecha_llegada||"").slice(0,10);
            if (!fl.startsWith(mesStr)) return;
            const cancelada = (e.estado||"confirmada") === "cancelada";
            const nr = (e.num_reservas||1) * (cancelada ? -1 : 1);
            netoPorDia[fl] = (netoPorDia[fl]||0) + nr;
          });
        }

        const diasDelMes = hmMesSel!=null ? (() => {
          const diasEnMes = new Date(anio, hmMesSel+1, 0).getDate();
          const pad = n => String(n).padStart(2,"0");
          return Array.from({length:diasEnMes},(_,di)=>{
            const dt   = new Date(anio, hmMesSel, di+1);
            const iso  = `${anio}-${pad(hmMesSel+1)}-${pad(di+1)}`;
            const prod = produccion.find(r=>r.fecha===iso);
            const esFut = iso > hoyStr2;
            const neto  = netoPorDia[iso] || 0;
            let occ=null, adr=null;
            if (prod) {
              occ = prod.hab_disponibles>0 ? Math.min(100,prod.hab_ocupadas/prod.hab_disponibles*100) : null;
              adr = prod.hab_ocupadas>0    ? (prod.revenue_hab/prod.hab_ocupadas) : null;
            } else if (iso >= hoyStr2) {
              occ = neto>0 ? Math.min(100, neto/habHotel*100) : null;
            }
            const resUltDia = pickupUltimoDiaPorDia[iso] || 0;
            return { iso, dia:di+1, diaSem:dt.getDay(), occ, adr, esFut, tieneReal:!!prod, resUltDia, neto };
          });
        })() : [];

        return (
          <>
          {/* ── MODALES (fixed, fuera de la card combinada) ── */}

            {/* ── MODAL HEATMAP DIARIO ── */}
            {hmMesSel!=null && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
                onClick={()=>setHmMesSel(null)}>
                <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:560, padding:"20px 24px", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}
                  onClick={e=>e.stopPropagation()}>

                  {/* Cabecera compacta */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={()=>setHmMesSel(m=>m>0?m-1:11)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:12, color:C.textMid }}>‹</button>
                      <h3 style={{ fontSize:15, fontWeight:700, color:C.text }}>{MESES_H[hmMesSel]} {anio}</h3>
                      <button onClick={()=>setHmMesSel(m=>m<11?m+1:0)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:12, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>›</button>
                    </div>
                    <button onClick={()=>setHmMesSel(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:15, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
                  </div>

                  {/* Días semana */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
                    {t("dias_semana").map(d=>(
                      <p key={d} style={{ fontSize:9, color:C.textLight, textAlign:"center", fontWeight:600 }}>{d}</p>
                    ))}
                  </div>

                  {/* Grid días — todos con aspectRatio 1 */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }} onMouseLeave={()=>{ if(hmIsDragging){ setHmIsDragging(false); } }}>
                    {Array.from({length:(diasDelMes[0]?.diaSem===0?6:diasDelMes[0]?.diaSem-1)||0},(_,i)=>(
                      <div key={"e"+i} style={{ aspectRatio:"1" }}/>
                    ))}
                    {diasDelMes.map(({dia,occ,adr,esFut,resUltDia})=>{
                      const resDia = resUltDia || 0;
                      const tieneReserva = resDia > 0;
                      const _pad2 = n=>String(n).padStart(2,"0");
                      const isoDay = hmMesSel!=null ? `${anio}-${_pad2(hmMesSel+1)}-${_pad2(dia)}` : "";
                      const inSel = hmIsDragging && hmDragStart!=null && hmDragEnd!=null &&
                        dia >= Math.min(hmDragStart,hmDragEnd) && dia <= Math.max(hmDragStart,hmDragEnd);
                      const evDay = hmEvents.filter(ev => ev.from <= isoDay && ev.to >= isoDay);
                      const borderColor = inSel ? "#3B82F6" : tieneReserva ? "#B8860B" : occ!=null ? heatColor(occ)+"CC" : C.border;
                      const bg = inSel ? "#3B82F618" : occ!=null ? heatBg(occ) : C.bg;
                      return (
                        <div key={dia}
                          style={{ aspectRatio:"1", borderRadius:5, background: bg, border:`${inSel?"2px":"1.5px"} solid ${borderColor}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1, position:"relative", cursor:"crosshair", userSelect:"none" }}
                          onMouseDown={(e)=>{ e.preventDefault(); setHmDragStart(dia); setHmDragEnd(dia); setHmIsDragging(true); }}
                          onMouseEnter={()=>{ if(hmIsDragging) setHmDragEnd(dia); }}
                          onMouseUp={()=>{
                            if(hmIsDragging){
                              setHmIsDragging(false);
                              const from=Math.min(hmDragStart||dia,dia), to=Math.max(hmDragStart||dia,dia);
                              if(from!==to){
                                setHmEventEdit({title:"",color:"#3B82F6",notes:""});
                                setHmEventForm({ fromISO:`${anio}-${_pad2(hmMesSel+1)}-${_pad2(from)}`, toISO:`${anio}-${_pad2(hmMesSel+1)}-${_pad2(to)}` });
                              }
                            }
                          }}>
                          {tieneReserva && (
                            <span style={{ position:"absolute", top:2, right:2, fontSize:8, lineHeight:1, animation:"pulse-rayo 1.5s ease-in-out infinite" }}>⚡</span>
                          )}
                          {evDay.length>0 && (
                            <div style={{ position:"absolute", bottom:2, left:2, right:2, display:"flex", gap:1, justifyContent:"center" }}>
                              {evDay.map((ev,ei)=><span key={ei} style={{ width:8, height:8, borderRadius:"50%", background:ev.color, display:"inline-block", flexShrink:0 }}/>)}
                            </div>
                          )}
                          <p style={{ fontSize:8, color:C.textLight, lineHeight:1 }}>{dia}</p>
                          {occ!=null
                            ? <p style={{ fontSize:11, fontWeight:800, color:heatColor(occ), lineHeight:1 }}>{occ.toFixed(0)}%</p>
                            : <p style={{ fontSize:8, color:C.border }}>—</p>
                          }
                          {adr && !esFut && <p style={{ fontSize:7, color:C.textLight, lineHeight:1 }}>€{Math.round(adr)}</p>}
                          {resDia!==0 && <p style={{ fontSize:7, color:tieneReserva?"#B8860B":C.red, fontWeight:700, lineHeight:1 }}>{resDia>0?"+":""}{resDia}</p>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Leyenda */}
                  <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                    {[["#81C784","<25%"],["#4CAF50","25-40%"],["#FFC107","40-55%"],["#FF7043","55-70%"],["#E53935","70-85%"],["#B71C1C",">85%"]].map(([col,lbl])=>(
                      <span key={lbl} style={{ display:"flex", alignItems:"center", gap:3, fontSize:9, color:C.textLight }}>
                        <span style={{ width:10, height:10, borderRadius:2, background:col, display:"inline-block" }}/>
                        {lbl}
                      </span>
                    ))}
                    <span style={{ fontSize:9, color:C.textLight, display:"flex", alignItems:"center", gap:3 }}>
                      <span style={{ fontSize:10 }}>⚡</span> Reserva captada
                    </span>
                    <span style={{ fontSize:9, color:"#3B82F6", fontWeight:600, marginLeft:"auto" }}>Arrastra para crear evento</span>
                  </div>

                  {/* Eventos del mes */}
                  {hmMesSel!=null && (() => {
                    const _pad2 = n=>String(n).padStart(2,"0");
                    const mesPrefix = `${anio}-${_pad2(hmMesSel+1)}`;
                    const evMes = hmEvents.map((ev,idx)=>({...ev,idx})).filter(ev => ev.from.slice(0,7)===mesPrefix || ev.to.slice(0,7)===mesPrefix);
                    if (evMes.length===0) return null;
                    return (
                      <div style={{ marginTop:12, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                        {evMes.map(ev=>(
                          <div key={ev.idx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                            <span style={{ width:8, height:8, borderRadius:2, background:ev.color, display:"inline-block", flexShrink:0 }}/>
                            <span style={{ fontSize:12, fontWeight:600, color:C.text, flex:1 }}>{ev.title||"(sin título)"}</span>
                            <span style={{ fontSize:10, color:C.textLight }}>
                              {ev.from.slice(8,10)}/{ev.from.slice(5,7)} – {ev.to.slice(8,10)}/{ev.to.slice(5,7)}
                            </span>
                            <button onClick={()=>borrarHmEvent(ev.idx)} style={{ background:"none", border:"none", cursor:"pointer", color:C.red, fontSize:13, padding:"0 2px", lineHeight:1 }}>×</button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                </div>
              </div>
            )}

            {/* ── FORM EVENTO HEATMAP ── */}
            {hmEventForm && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
                onClick={()=>setHmEventForm(null)}>
                <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:380, padding:"24px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
                  onClick={e=>e.stopPropagation()}>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Nuevo evento</h3>
                  <div style={{ display:"flex", gap:8, marginBottom:14, padding:"8px 12px", background:C.bg, borderRadius:8, border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, color:C.textLight }}>📅</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>
                      {hmEventForm.fromISO.split("-").reverse().join("/")} — {hmEventForm.toISO.split("-").reverse().join("/")}
                    </span>
                  </div>
                  <input
                    placeholder="Nombre del evento (feria, congreso...)"
                    value={hmEventEdit.title}
                    onChange={e=>setHmEventEdit(p=>({...p,title:e.target.value}))}
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:12, boxSizing:"border-box" }}
                    autoFocus
                  />
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:6 }}>Color</p>
                    <div style={{ display:"flex", gap:8 }}>
                      {["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"].map(col=>(
                        <button key={col} onClick={()=>setHmEventEdit(p=>({...p,color:col}))}
                          style={{ width:24, height:24, borderRadius:6, background:col, border:hmEventEdit.color===col?"3px solid #fff":"2px solid transparent", cursor:"pointer", padding:0, outline:hmEventEdit.color===col?`2px solid ${col}`:"none" }}/>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Notas (opcional)"
                    value={hmEventEdit.notes}
                    onChange={e=>setHmEventEdit(p=>({...p,notes:e.target.value}))}
                    rows={2}
                    style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:12, fontFamily:"inherit", outline:"none", resize:"none", marginBottom:16, boxSizing:"border-box" }}
                  />
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                    <button onClick={()=>setHmEventForm(null)}
                      style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textLight, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      Cancelar
                    </button>
                    <button onClick={()=>{
                      guardarHmEvent({ from:hmEventForm.fromISO, to:hmEventForm.toISO, title:hmEventEdit.title, color:hmEventEdit.color, notes:hmEventEdit.notes });
                      setHmEventForm(null);
                    }} style={{ padding:"7px 16px", borderRadius:8, border:"none", background:"#3B82F6", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}

          <Card style={{ display:"flex", padding:0, overflow:"hidden", marginBottom:16 }}>

            {/* ── HEATMAP (izquierda) ── */}
            <div style={{ flex:2, padding:"20px 22px", display:"flex", flexDirection:"column" }}>
              <div style={{ marginBottom:14 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px" }}>
                  {t("ocup_mensual")} <span style={{ color:C.accent }}>| {t("meses_full")[mes].toUpperCase()} {anio}</span>
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"repeat(3,1fr)", gap:8, flex:1 }}>
                {occPorMes.map(({label, mi, occ, esOtb})=>{
                  const mesKey = `${anio}-${String(mi+1).padStart(2,"0")}`;
                  const resUltDia = pickupUltimoDiaPorMes[mesKey] || 0;
                  const esCaliente = top2Meses.includes(mesKey) && resUltDia > 0;
                  const esMesActual = mi === mes;
                  return (
                    <div key={mi} onClick={()=>setHmMesSel(mi)}
                      title={occ!=null?`${label}: ${occ.toFixed(0)}%`:""}
                      style={{
                        borderRadius:8, padding:"10px 6px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                        background: esMesActual ? `${C.accent}18` : occ!=null ? heatBg(occ) : C.bg,
                        border:`2px solid ${esMesActual ? C.accent : esCaliente?"#E85D04":occ!=null?heatColor(occ)+"CC":C.border}`,
                        cursor:"pointer", textAlign:"center", transition:"all 0.15s", position:"relative"
                      }}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      {esCaliente && (
                        <span title={`${resUltDia} reservas captadas el ${ultimoDiaImportado}`} style={{ position:"absolute", top:4, right:5, fontSize:14, lineHeight:1, animation:"pulse-rayo 1.5s ease-in-out infinite" }}>⚡</span>
                      )}
                      <p style={{ fontSize:9, fontWeight:700, color: esMesActual ? C.accent : C.textLight, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{label}</p>
                      {occ!=null
                        ? <p style={{ fontSize:17, fontWeight:800, color: esMesActual ? C.accent : C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{occ.toFixed(0)}%</p>
                        : <p style={{ fontSize:12, color:C.border }}>—</p>
                      }
                      {resUltDia !== 0
                        ? <p style={{ fontSize:8, color:resUltDia>0?"#E85D04":C.red, fontWeight:700, marginTop:2 }}>{resUltDia>0?"+":""}{resUltDia} res.</p>
                        : esOtb && occ!=null
                          ? <p style={{ fontSize:8, color:"#7A9CC8", fontWeight:700, marginTop:2 }}>OTB</p>
                          : null
                      }
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize:10, color:C.textLight, marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:12 }}>⚡</span> Meses con mayor captación en el último día importado &nbsp;·&nbsp; <span style={{ fontSize:10, color:"#7A9CC8", fontWeight:700 }}>OTB</span> Dato estimado por reservas en cartera
              </p>
            </div>

            {/* ── SEPARADOR VERTICAL ── */}
            <div style={{ width:1, background:C.border, flexShrink:0, margin:"16px 0" }}/>

            {/* ── MOVIMIENTO OPERATIVO DIARIO (derecha) ── */}
            {(() => {
              const _p = n => String(n).padStart(2,"0");
              const hoy = new Date();
              const hoyStr = `${hoy.getFullYear()}-${_p(hoy.getMonth()+1)}-${_p(hoy.getDate())}`;
              const ayer = new Date(hoy); ayer.setDate(ayer.getDate()-1);
              const ayerStr = `${ayer.getFullYear()}-${_p(ayer.getMonth()+1)}-${_p(ayer.getDate())}`;

              const getFechaSalida = e => {
                if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
                if (e.noches && e.fecha_llegada) {
                  const d = new Date(e.fecha_llegada); d.setDate(d.getDate() + Number(e.noches));
                  return d.toISOString().slice(0,10);
                }
                return null;
              };
              const todasActivas = (pickupEntries||[]).filter(e => !e._grupo && (e.estado||"confirmada") !== "cancelada");

              const numEntradas      = todasActivas.filter(e => String(e.fecha_llegada||"").slice(0,10) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numSalidas       = todasActivas.filter(e => getFechaSalida(e) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numEstancias     = todasActivas.filter(e => { const fl=String(e.fecha_llegada||"").slice(0,10); const fs=getFechaSalida(e); return fl < hoyStr && fs > hoyStr; }).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numEntradasAyer  = todasActivas.filter(e => String(e.fecha_llegada||"").slice(0,10) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numSalidasAyer   = todasActivas.filter(e => getFechaSalida(e) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numEstanciasAyer = todasActivas.filter(e => { const fl=String(e.fecha_llegada||"").slice(0,10); const fs=getFechaSalida(e); return fl < ayerStr && fs > ayerStr; }).reduce((a,e)=>a+(e.num_reservas||1),0);

              const proxEntrada = numEntradas===0 ? todasActivas.map(e=>String(e.fecha_llegada||"").slice(0,10)).filter(f=>f>hoyStr).sort()[0]||null : null;
              const proxSalida  = numSalidas===0  ? todasActivas.map(e=>getFechaSalida(e)).filter(f=>f&&f>hoyStr).sort()[0]||null : null;

              const habH = datos.hotel?.habitaciones || 0;
              const netoHoy = habH ? (pickupEntries||[]).reduce((a,e) => {
                if (String(e.fecha_llegada||"").slice(0,10) !== hoyStr) return a;
                return a + (e.num_reservas||1) * ((e.estado||"confirmada")==="cancelada" ? -1 : 1);
              }, 0) : 0;
              const occHoy   = habH ? Math.min(Math.round(Math.max(0,netoHoy)/habH*100),100) : null;
              const occColor = occHoy>=85?"#E53935":occHoy>=70?"#C49A0A":occHoy>=50?C.accent:C.textLight;

              const Delta = ({ hoy, ayer }) => {
                const d = hoy - ayer;
                if (d === 0) return <span style={{ fontSize:11, color:C.textLight, fontWeight:600 }}>= ayer</span>;
                const col = d > 0 ? "#10B981" : "#EF4444";
                const arr = d > 0
                  ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,9 6,3 10,9" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,3 6,9 10,3" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
                return <span style={{ display:"inline-flex", alignItems:"center", gap:2, fontSize:12, fontWeight:700, color:col }}>{arr}{d>0?"+":""}{d}</span>;
              };

              const lbl = (col) => ({ fontSize:9, color:col, textTransform:"uppercase", letterSpacing:"1.2px", fontWeight:600 });
              const num = (col) => ({ fontSize:30, fontWeight:800, color:col, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 });
              const sep = { gridColumn:"1 / -1", borderTop:`1px solid ${C.border}` };
              const Rc=20, SWc=3.5, circC=2*Math.PI*Rc, sizeC=Rc*2+SWc*2;

              return (
                <div style={{ flex:"0 0 380px", padding:"20px 24px", display:"flex", flexDirection:"column", justifyContent:"center", gap:10 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px" }}>Movimiento Operativo Diario</p>
                    <p style={{ fontSize:10, color:C.textLight, marginTop:2 }}>{hoyStr}</p>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"22px 1fr auto auto", alignItems:"center", rowGap:10, columnGap:8 }}>

                    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                      <rect x="8" y="4" width="16" height="24" rx="1.5" stroke="#004B87" strokeWidth="2"/>
                      <line x1="8" y1="28" x2="24" y2="28" stroke="#004B87" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="20" cy="16" r="1.5" fill="#004B87"/>
                      <line x1="0" y1="16" x2="13" y2="16" stroke="#004B87" strokeWidth="2" strokeLinecap="round"/>
                      <polyline points="9,12 13,16 9,20" stroke="#004B87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={lbl("#004B87")}>Entradas{proxEntrada&&<span style={{ color:C.textLight, fontWeight:400 }}> · próx. {proxEntrada}</span>}</span>
                    <span style={num("#004B87")}>{numEntradas}</span>
                    <Delta hoy={numEntradas} ayer={numEntradasAyer}/>

                    <div style={sep}/>

                    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                      <rect x="4" y="6" width="24" height="20" rx="2" stroke="#7C3AED" strokeWidth="2"/>
                      <line x1="4" y1="12" x2="28" y2="12" stroke="#7C3AED" strokeWidth="2"/>
                      <circle cx="16" cy="20" r="3" stroke="#7C3AED" strokeWidth="1.5"/>
                    </svg>
                    <span style={lbl("#7C3AED")}>Estancias</span>
                    <span style={num("#7C3AED")}>{numEstancias}</span>
                    <Delta hoy={numEstancias} ayer={numEstanciasAyer}/>

                    <div style={sep}/>

                    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                      <rect x="8" y="4" width="16" height="24" rx="1.5" stroke="#E53935" strokeWidth="2"/>
                      <line x1="8" y1="28" x2="24" y2="28" stroke="#E53935" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1.5" fill="#E53935"/>
                      <line x1="8" y1="16" x2="21" y2="16" stroke="#E53935" strokeWidth="2" strokeLinecap="round"/>
                      <polyline points="17,12 21,16 17,20" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="21" y1="16" x2="32" y2="16" stroke="#E53935" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span style={lbl("#E53935")}>Salidas{proxSalida&&<span style={{ color:C.textLight, fontWeight:400 }}> · próx. {proxSalida}</span>}</span>
                    <span style={num("#E53935")}>{numSalidas}</span>
                    <Delta hoy={numSalidas} ayer={numSalidasAyer}/>

                    {occHoy !== null && <>
                      <div style={sep}/>
                      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                        <path d="M4 28V14L16 4l12 10v14" stroke={occColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="11" y="18" width="10" height="10" rx="1" stroke={occColor} strokeWidth="1.8"/>
                        <circle cx="16" cy="13" r="2" stroke={occColor} strokeWidth="1.5"/>
                      </svg>
                      <span style={lbl(occColor)}>Ocupación hoy</span>
                      <div style={{ position:"relative", width:sizeC, height:sizeC, flexShrink:0 }}>
                        <svg width={sizeC} height={sizeC} style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
                          <circle cx={sizeC/2} cy={sizeC/2} r={Rc} fill="none" stroke={`${occColor}22`} strokeWidth={SWc}/>
                          <circle cx={sizeC/2} cy={sizeC/2} r={Rc} fill="none" stroke={occColor} strokeWidth={SWc} strokeLinecap="round"
                            strokeDasharray={circC} strokeDashoffset={circC*(1-occHoy/100)}
                            style={{ transition:"stroke-dashoffset 0.6s ease" }}/>
                        </svg>
                        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:11, fontWeight:800, color:occColor, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{occHoy}%</span>
                        </div>
                      </div>
                      <span/>
                    </>}
                  </div>
                </div>
              );
            })()}

          </Card>

          {/* ── ADR & OCC — fila completa debajo del heatmap ── */}
          {(() => {
            const metricas = [
              { key:"adr_occ", label:t("adr_ocupacion") },
            ];
            return (
              <Card style={{ display:"flex", flexDirection:"column", minHeight:360, marginTop:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>
                    {metricas.find(m=>m.key===metricaSel)?.label}
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    {/* Leyenda */}
                    <div style={{ display:"flex", gap:14 }}>
                      {[
                        { color:"#004B87", opacity:0.75, label:"Ocupación", type:"bar" },
                        { color:"#B8860B", opacity:1,    label:"ADR",       type:"line" },
                      ].map((item,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          {item.type==="bar" && <div style={{ width:10, height:10, borderRadius:2, background:item.color, opacity:item.opacity }}/>}
                          {item.type==="line" && <div style={{ width:16, height:2, background:item.color, borderRadius:1 }}/>}
                          {item.type==="dash" && <div style={{ width:16, height:2, background:`repeating-linear-gradient(90deg,${item.color} 0,${item.color} 4px,transparent 4px,transparent 7px)` }}/>}
                          <span style={{ fontSize:10, color:C.textLight, fontWeight:500, letterSpacing:"0.3px" }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ height:300 }} onMouseDown={e => e.preventDefault()}>
                  <ResponsiveContainer width="100%" height={300}>
                    {metricaSel === "adr_occ" ? (
                      <ComposedChart data={porMes} barSize={14} barCategoryGap="32%">
                        <defs>
                          <linearGradient id="gradOcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} height={18} interval={0} tick={{ fill: C.textLight, fontSize: 11 }}/>
                        <YAxis yAxisId="left"  tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€"/>
                        <Tooltip content={<CustomTooltip/>} cursor={false}/>
                        <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill="url(#gradOcc)" radius={[4,4,0,0]}
                          cursor="pointer" activeBar={false}
                          shape={(p) => <AnimatedBar {...p} onClick={() => { if(p?.mesIdx!=null) setModalDiario({mesIdx:p.mesIdx, anioIdx:p.anioIdx}); }}/>}
                          onClick={(data) => { if(data?.mesIdx!=null) setModalDiario({mesIdx:data.mesIdx, anioIdx:data.anioIdx}); }}
                        />
                        <Line yAxisId="right" dataKey="adr" name="ADR" type="monotone" stroke="#B8860B" strokeWidth={2} dot={{fill:"#B8860B", r:3, strokeWidth:0}} activeDot={{r:4}}/>
                      </ComposedChart>
                    ) : (
                      <AreaChart data={porMes}>
                        <defs>
                          <linearGradient id="gMetrica" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.accent} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} height={18} interval={0} tick={{ fill: C.textLight, fontSize: 11 }}/>
                        <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€"/>
                        <Tooltip content={<CustomTooltip/>} cursor={{ fill: "rgba(10,37,64,0.04)" }}/>
                        <Area type="monotone" dataKey={metricaSel} name={metricaSel==="revpar"?"RevPAR":"TRevPAR"} stroke={C.accent} strokeWidth={2} fill="url(#gMetrica)" dot={{fill:C.accent,r:2}} activeDot={{r:3}}/>
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </Card>
            );
          })()}
          </>
        );
      })()}


      <Card>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 16 }}>
          {t("ultimos_12m")}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {[t("th_anio"),t("th_mes"),t("th_ocup"),t("th_adr"),t("th_revpar"),t("th_trevpar"),t("th_rev_hab"),t("th_rev_total")].map((h,hi) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: hi<=1?"left":"right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porMes.map((d, i) => (
                <tr key={i} onClick={() => onMesDetalle && onMesDetalle(d.mesIdx, d.anioIdx)} style={{ borderBottom: `1px solid ${C.border}`, background: d.mesIdx === mes && d.anioIdx === anio ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard), cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.accentLight} onMouseLeave={e => e.currentTarget.style.background = MESES_CORTO.indexOf(d.mes) === mes ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard)}>
                  <td style={{ padding: "9px 14px", fontWeight: 600, fontSize: 13, color: C.textLight }}>{d.anioIdx}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, fontSize: 15, color: C.accent, textDecoration: "underline", cursor: "pointer" }}>{d.mesNombre}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: d.occ > 80 ? C.green : C.textMid }}>{d.occ}%</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{d.adr}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.revpar}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.blue }}>€{d.trevpar}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revHab).toLocaleString("es-ES")}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revTotal).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {kpiModal && <KpiModal kpi={kpiModal} datos={datos} mes={mes} anio={anio} onClose={()=>setKpiModal(null)} />}

      {/* ── MODAL DIARIO ADR & OCUPACIÓN ── */}
      {modalDiario && (() => {
        const { mesIdx, anioIdx } = modalDiario;
        const MESES_FULL2 = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const pad = n => String(n).padStart(2,"0");
        const diasData = (datos.produccion||[])
          .filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mesIdx && f.getFullYear()===anioIdx;
          })
          .sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))
          .map(r => {
            const f = new Date(r.fecha+"T00:00:00");
            const habDis = r.hab_disponibles||30;
            return {
              dia: f.getDate(),
              label: `${f.getDate()}/${f.getMonth()+1}`,
              fecha: f.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),
              occ: habDis>0 ? Math.min(100, Math.round(r.hab_ocupadas/habDis*100)) : 0,
              adr: r.hab_ocupadas>0 ? Math.round(r.revenue_hab/r.hab_ocupadas) : 0,
            };
          });

        const pptoMes = (datos.presupuesto||[]).find(p=>p.anio===anioIdx && p.mes===mesIdx+1);

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={()=>setModalDiario(null)}>
            <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:780, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL2[mesIdx]} {anioIdx}</p>
                  <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5 }}>{t("adr_ocup_diaria")}</h3>
                </div>
                <button onClick={()=>setModalDiario(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:16, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMid;}}>×</button>
              </div>

              {diasData.length === 0 ? (
                <p style={{ color:C.textLight, textAlign:"center", padding:40 }}>{t("sin_datos_mes")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={diasData} barSize={10} barCategoryGap="30%">
                    <defs>
                      <linearGradient id="gradOccDiario" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: C.textLight, fontSize: 11 }} interval={Math.floor(diasData.length/8)}/>
                    <YAxis yAxisId="left"  tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€"/>
                    <Tooltip content={<CustomTooltip/>} cursor={false}/>
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }}/>
                    <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill="url(#gradOccDiario)" radius={[4,4,0,0]} activeBar={false}/>
                    <Line yAxisId="right" dataKey="adr" name="ADR" type="monotone" stroke="#B8860B" strokeWidth={2} dot={{fill:"#B8860B",r:2,strokeWidth:0}} activeDot={{r:4}}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PICKUP VIEW ──────────────────────────────────────────────────
function PickupView({ datos }) {
  const t = useT();
  const { session, presupuesto, produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const cargando = false;
  const [anio, setAnio]                   = useState(new Date().getFullYear());
  const [trimSel, setTrimSel] = useState(null);
  const [canalMetric, setCanalMetric]     = useState("adr"); // "adr" | "noches"

  const hoy     = new Date();
  const padL    = n => String(n).padStart(2,"0");
  const hoyStr  = `${hoy.getFullYear()}-${padL(hoy.getMonth()+1)}-${padL(hoy.getDate())}`;
  const MESES   = t("meses_corto");

  // Año inicial: el más reciente con datos
  useEffect(() => {
    if (pickupEntries.length > 0) {
      const anios = [...new Set(pickupEntries.map(e => String(e.fecha_llegada||"").slice(0,4)).filter(Boolean).map(Number))].sort();
      if (anios.length > 0) setAnio(anios[anios.length - 1]);
    }
  }, [pickupEntries.length]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && trimSel !== null) setTrimSel(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [trimSel]);

  // ── OTB por mes (suma num_reservas por fecha_llegada) ──
  const otbPorMes = {};
  (pickupEntries || []).forEach(e => {
    const f = String(e.fecha_llegada || "").slice(0, 7);
    if (!f || f.length < 7) return;
    otbPorMes[f] = (otbPorMes[f] || 0) + (e.num_reservas || 1);
  });

  // ── Presupuesto por mes del año seleccionado ──
  const pptoPorMes = {};
  (presupuesto || []).forEach(p => {
    if (!p.anio || !p.mes) return;
    // Convertir OCC ppto + habitaciones → reservas estimadas
    const hab = datos.hotel?.habitaciones || 30;
    const diasMes = new Date(p.anio, p.mes, 0).getDate();
    const reservasPpto = p.occ_ppto ? Math.round((p.occ_ppto / 100) * hab * diasMes) : null;
    const key = `${p.anio}-${String(p.mes).padStart(2,"0")}`;
    pptoPorMes[key] = reservasPpto;
  });

  // ── Datos para la gráfica: 4 trimestres del año seleccionado ──
  const TRIMESTRES = ["Q1", "Q2", "Q3", "Q4"];
  const datosGrafica = TRIMESTRES.map((trim, qi) => {
    const meses = [qi*3, qi*3+1, qi*3+2]; // índices 0-based
    let otb = 0, ppto = 0, ly = 0, tienePpto = false, tieneLY = false;
    meses.forEach(mi => {
      const key   = `${anio}-${String(mi+1).padStart(2,"0")}`;
      const keyLY = `${anio-1}-${String(mi+1).padStart(2,"0")}`;
      otb  += otbPorMes[key]  || 0;
      ly   += otbPorMes[keyLY] || 0;
      if (pptoPorMes[key] != null) { ppto += pptoPorMes[key]; tienePpto = true; }
      if (otbPorMes[keyLY]) tieneLY = true;
    });
    return { mes: trim, otb: otb || null, ppto: tienePpto ? ppto : null, ly: tieneLY ? ly : null };
  });

  // ── Años disponibles: unión de pickup + presupuesto (siempre navegable) ──
  const aniosPickupDisp = Object.keys(otbPorMes).map(k => parseInt(k.slice(0,4)));
  const aniosPptoDisp   = (presupuesto || []).map(p => p.anio).filter(Boolean);
  const aniosDisp = [...new Set([...aniosPickupDisp, ...aniosPptoDisp, anio])].sort();

  // ── Colores gráfica: dorados con rango amplio ──
  const COL_OTB  = "#5C3300";  // marrón dorado oscuro — OTB actual
  const COL_PPTO = "#C8850C";  // naranja dorado medio — presupuesto
  const COL_LY   = "#F2D06B";  // amarillo dorado claro — año anterior

  // ── Drill-down por trimestre ──
  const MESES_CORTO_PU = t("meses_corto");
  const datosDetalle = trimSel !== null ? [0,1,2].map(offset => {
    const mi = trimSel * 3 + offset;
    const key   = `${anio}-${String(mi+1).padStart(2,"0")}`;
    const keyLY = `${anio-1}-${String(mi+1).padStart(2,"0")}`;
    const otb  = otbPorMes[key]  || 0;
    const ly   = otbPorMes[keyLY] || 0;
    const ppto = pptoPorMes[key] ?? null;
    return { mes: MESES_CORTO_PU[mi], otb: otb||null, ppto, ly: ly||null };
  }) : [];

  // ── Calcular máximo para escala ──
  const maxVal = Math.max(
    ...datosGrafica.map(d => Math.max(d.otb||0, d.ppto||0, d.ly||0)),
    10
  );
  const escala = [0, 25, 50, 75, 100].map(p => Math.round(maxVal * p / 100));
  escala.push(Math.ceil(maxVal / 10) * 10);
  const yMax = Math.ceil(maxVal * 1.15 / 10) * 10;

  const barH = (val) => val && yMax > 0 ? `${Math.min((val/yMax)*100, 100)}%` : "0%";

  const hayDatos = datosGrafica.some(d => d.otb || d.ppto || d.ly);

  if (cargando) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:12 }}>
      <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <p style={{ color:C.textLight, fontSize:13 }}>{t("cargando_pickup")}</p>
    </div>
  );

  // ── Pickup de ayer ──
  const hoyD = new Date();
  const ayerD = new Date(hoyD); ayerD.setDate(hoyD.getDate()-1);
  const ayerStr = `${ayerD.getFullYear()}-${String(ayerD.getMonth()+1).padStart(2,"0")}-${String(ayerD.getDate()).padStart(2,"0")}`;
  const MESES_FULL_PU = t("meses_full");

  const ultDia = [...pickupEntries].map(e=>String(e.fecha_pickup||"").slice(0,10)).filter(f=>f.length===10).sort().pop() || "";
  const reservasUltDia = pickupEntries.filter(e => String(e.fecha_pickup||"").slice(0,10) === ultDia && (e.estado||"confirmada") !== "cancelada").sort((a,b)=>(a.fecha_llegada||"").localeCompare(b.fecha_llegada||""));
  const fmtDatePU = d => { if (!d) return "—"; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };

  const reservasAyer = pickupEntries.filter(e => String(e.fecha_pickup||"").slice(0,10) === ayerStr);

  const normCanal = c => {
    const aliases = { "Directo Web": "Directo", "Teléfono": "Directo" };
    return aliases[c] || c || "Directo";
  };

  const ayerPorMes = {};
  const ayerPorCanal = {};
  let ayerTotal = 0;
  reservasAyer.forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,7); // YYYY-MM
    const mes = parseInt(fl.slice(5,7)) - 1;
    const nr = e.num_reservas || 1;
    ayerPorMes[mes] = (ayerPorMes[mes]||0) + nr;
    const canal = normCanal(e.canal);
    ayerPorCanal[canal] = (ayerPorCanal[canal]||0) + nr;
    ayerTotal += nr;
  });

  const CANAL_COLORS = {
    "Booking.com": "#0052CC", "Expedia": "#FFD700",
    "Directo": "#555555", "Agencia": "#7C3AED"
  };

  // ── Cancelaciones de ayer ──
  const cancelacionesAyer = reservasAyer.filter(e => (e.estado||"confirmada") === "cancelada");
  const cancelTotal = cancelacionesAyer.length;
  const cancelPorMes = {};
  cancelacionesAyer.forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,7);
    const mes = parseInt(fl.slice(5,7)) - 1;
    cancelPorMes[mes] = (cancelPorMes[mes]||0) + 1;
  });

  // ── Duración media de estancia ──
  const conNoches = pickupEntries.filter(e => e.noches && e.noches > 0 && (e.estado||"confirmada") !== "cancelada" && normCanal(e.canal) !== "Grupos/Eventos");
  const nochesMed = conNoches.length > 0
    ? (conNoches.reduce((a,e)=>a+(e.noches||0),0) / conNoches.length).toFixed(1)
    : null;
  // Por canal
  const nochesPorCanal = {};
  conNoches.forEach(e => {
    const c = normCanal(e.canal);
    if (!nochesPorCanal[c]) nochesPorCanal[c] = { total:0, count:0 };
    nochesPorCanal[c].total  += e.noches||0;
    nochesPorCanal[c].count  += 1;
  });
  const nochesCanalData = Object.entries(nochesPorCanal)
    .map(([canal, d]) => ({ canal, media: (d.total/d.count).toFixed(1) }))
    .sort((a,b) => b.media - a.media);

  // ── Precio medio por reserva ──
  const conPrecio = pickupEntries.filter(e => e.precio_total && e.precio_total > 0 && (e.estado||"confirmada") !== "cancelada" && normCanal(e.canal) !== "Grupos/Eventos");
  const precioMed = conPrecio.length > 0
    ? Math.round(conPrecio.reduce((a,e)=>a+(e.precio_total||0),0) / conPrecio.length)
    : null;
  // Por canal
  const precioPorCanal = {};
  conPrecio.forEach(e => {
    const c = normCanal(e.canal);
    if (!precioPorCanal[c]) precioPorCanal[c] = { total:0, count:0 };
    precioPorCanal[c].total += e.precio_total||0;
    precioPorCanal[c].count += 1;
  });
  const precioCanalData = Object.entries(precioPorCanal)
    .map(([canal, d]) => ({ canal, media: Math.round(d.total/d.count), color: CANAL_COLORS[canal]||C.accent }))
    .sort((a,b) => b.media - a.media);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── PICKUP AYER ── */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>{t("reservas_ayer")}</p>
            <p style={{ fontSize:12, color:C.textLight, marginTop:2 }}>
              {ayerD.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).replace(/^\w/,c=>c.toUpperCase())}
            </p>
          </div>
          <div style={{ background:"#B8860B22", border:"1px solid #B8860B44", borderRadius:10, padding:"10px 20px", textAlign:"center" }}>
            <p style={{ fontSize:28, fontWeight:800, color:"#B8860B", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{ayerTotal}</p>
            <p style={{ fontSize:10, color:"#B8860B", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginTop:3 }}>{t("reservas_captadas")}</p>
          </div>
        </div>

        {ayerTotal === 0 ? (
          <p style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>{t("no_reservas_ayer")}</p>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

            {/* Tabla reservas captadas último día */}
            <div style={{ overflowY:"auto", maxHeight:220 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                Captadas el {fmtDatePU(ultDia)}
              </p>
              {reservasUltDia.length === 0 ? (
                <p style={{ fontSize:12, color:C.textLight }}>Sin reservas</p>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead>
                    <tr>
                      {["Llegada","Canal","Noches","ADR"].map((h,hi)=>(
                        <th key={h} style={{ padding:"4px 8px", textAlign:hi>=2?"right":"left", fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reservasUltDia.map((e,i)=>{
                      const adr = (e.precio_total && e.noches && e.noches>0) ? Math.round(e.precio_total/e.noches) : null;
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?C.bg:C.bgCard }}>
                          <td style={{ padding:"5px 8px", fontWeight:600, color:C.accent }}>{fmtDatePU(e.fecha_llegada)}</td>
                          <td style={{ padding:"5px 8px", color:C.textMid }}>{e.canal||"—"}</td>
                          <td style={{ padding:"5px 8px", textAlign:"right", color:C.textMid }}>{e.noches??'—'}</td>
                          <td style={{ padding:"5px 8px", textAlign:"right", fontWeight:700, color:C.text }}>{adr!=null?`€${adr}`:"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Por canal — Pie chart */}
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>{t("por_canal")}</p>
              {Object.keys(ayerPorCanal).length > 0 ? (() => {
                const pieData = Object.entries(ayerPorCanal).sort((a,b)=>b[1]-a[1]).map(([canal, nr]) => ({
                  name: canal, value: nr, color: CANAL_COLORS[canal] || C.accent
                }));
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <PieChart width={110} height={110}>
                      <defs>
                        {pieData.map((entry, i) => (
                          <linearGradient key={i} id={`pieGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.65}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={pieData} cx={50} cy={50} innerRadius={28} outerRadius={50}
                        dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                        {pieData.map((entry, i) => <Cell key={i} fill={`url(#pieGrad_${i})`} stroke="none"/>)}
                      </Pie>
                    </PieChart>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                      {pieData.map((entry, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:entry.color, flexShrink:0 }}/>
                          <span style={{ fontSize:11, color:C.textMid, flex:1 }}>{entry.name}</span>
                          <span style={{ fontSize:11, color:C.textLight }}>{Math.round(entry.value/ayerTotal*100)}%</span>
                          <span style={{ fontSize:11, fontWeight:700, color:entry.color }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : <p style={{ fontSize:12, color:C.textLight }}>{t("sin_datos")}</p>}
            </div>

          </div>
        )}
      </Card>

      {/* Selector año */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button
            onClick={()=>setAnio(a=>{const i=aniosDisp.indexOf(a); return i>0?aniosDisp[i-1]:a;})}
            disabled={aniosDisp.indexOf(anio)===0}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor: aniosDisp.indexOf(anio)===0?"default":"pointer", fontSize:15, color: aniosDisp.indexOf(anio)===0?C.border:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <span style={{ fontWeight:700, fontSize:16, color:C.text, minWidth:44, textAlign:"center", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{anio}</span>
          <button
            onClick={()=>setAnio(a=>{const i=aniosDisp.indexOf(a); return i<aniosDisp.length-1?aniosDisp[i+1]:a;})}
            disabled={aniosDisp.indexOf(anio)===aniosDisp.length-1}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor: aniosDisp.indexOf(anio)===aniosDisp.length-1?"default":"pointer", fontSize:15, color: aniosDisp.indexOf(anio)===aniosDisp.length-1?C.border:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </div>
      </div>

      {/* ── FECHAS CALIENTES + CANCELACIONES | PICKUP TRIMESTRAL ── */}
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, alignItems:"start" }}>

        {/* Col izquierda: Fechas Calientes + Cancelaciones */}
        <Card>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>🔥 {t("fechas_calientes")}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(() => {
            const padL = n => String(n).padStart(2,"0");
            const hoyStr = `${hoy.getFullYear()}-${padL(hoy.getMonth()+1)}-${padL(hoy.getDate())}`;
            const hab = datos.hotel?.habitaciones || 30;
            const otbPorDia = {};
            (pickupEntries || []).forEach(e => {
              const fl = String(e.fecha_llegada || "").slice(0, 10);
              const fp = String(e.fecha_pickup  || "").slice(0, 10);
              if (fl.length < 10 || fp.length < 10) return;
              if (fl <= hoyStr) return;
              if (fp > hoyStr) return;
              if ((e.estado || "confirmada") === "cancelada") return;
              otbPorDia[fl] = (otbPorDia[fl] || 0) + (e.num_reservas || 1);
            });
            const top5 = Object.entries(otbPorDia).sort((a,b) => b[1]-a[1]).slice(0,5);
            if (top5.length === 0) return <p style={{ fontSize:11, color:C.textLight }}>{t("sin_futuras")}</p>;
            const maxVal = top5[0][1] || 1;
            const fmt = (iso) => {
              const [y,m,d] = iso.split("-");
              const dt = new Date(Number(y), Number(m)-1, Number(d));
              return `${t("dias_abrev")[dt.getDay()]} ${Number(d)} ${t("meses_corto")[Number(m)-1]}`;
            };
            return top5.map(([fecha, otb]) => {
              const occ = Math.round(otb / hab * 100);
              const occColor = occ >= 85 ? "#E53935" : occ >= 70 ? "#FF7043" : occ >= 55 ? "#FFC107" : "#4CAF50";
              return (
                <div key={fecha} style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{fmt(fecha)}</span>
                    <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
                        <span style={{ fontSize:11, fontWeight:700, color:occColor }}>{occ}%</span>
                        <span style={{ fontSize:8, color:C.textLight, lineHeight:1, marginTop:1 }}>ocup.</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:COL_OTB, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{otb} {t("res_abrev")}</span>
                    </div>
                  </div>
                  <div style={{ width:"100%", height:4, background:C.border, borderRadius:2 }}>
                    <div style={{ width:`${Math.round(otb/maxVal*100)}%`, height:"100%", background:`linear-gradient(to right, ${occColor}77, ${occColor})`, borderRadius:2 }} />
                  </div>
                </div>
              );
            });
          })()}
          </div>
          <p style={{ fontSize:11, color:C.text, marginTop:8, fontStyle:"italic", opacity:0.75 }}>
            💡 Se recomienda comprobar el precio de estas fechas.
          </p>

          <div style={{ borderTop:`1px solid ${C.border}`, margin:"16px 0" }}/>

          {/* CANCELACIONES DE AYER */}
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:14, color:C.text, marginBottom:2 }}>{t("cancelaciones_ayer")}</p>
          <p style={{ fontSize:10, color:C.textLight, marginBottom:10 }}>
            {ayerD.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).replace(/^\w/,c=>c.toUpperCase())}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ background: cancelTotal>0?C.redLight:"#E6F7EE", border:`1px solid ${cancelTotal>0?"#D32F2F44":"#1A7A3C44"}`, borderRadius:8, padding:"5px 12px", display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ fontSize:18, fontWeight:800, color:cancelTotal>0?C.red:C.green, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{cancelTotal}</span>
              <span style={{ fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, color:cancelTotal>0?C.red:C.green }}>{cancelTotal===1?"cancelación":"cancelaciones"}</span>
            </div>
          </div>
          {cancelTotal === 0 ? (
            <p style={{ color:C.green, fontSize:12, textAlign:"center", padding:"8px 0" }}>✅ {t("sin_cancelaciones")}</p>
          ) : (() => {
            const fmtFecha = (iso) => {
              if (!iso) return "—";
              const [y,m,d] = String(iso).slice(0,10).split("-");
              const dt = new Date(Number(y), Number(m)-1, Number(d));
              return `${t("dias_abrev")[dt.getDay()]} ${Number(d)} ${t("meses_corto")[Number(m)-1]} ${y}`;
            };
            const thS = { fontSize:9, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:0.7, padding:"0 6px 6px", textAlign:"left", borderBottom:`1px solid ${C.border}` };
            const tdS = { fontSize:10, padding:"6px 6px", verticalAlign:"middle" };
            return (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <th style={thS}>Llegada</th>
                  <th style={thS}>Canal</th>
                  <th style={{ ...thS, textAlign:"right" }}>ADR</th>
                </tr></thead>
                <tbody>
                  {cancelacionesAyer.map((e, i) => {
                    const canal = normCanal(e.canal) || "—";
                    const adr = e.precio_total && e.noches > 0
                      ? Math.round(e.precio_total / e.noches)
                      : e.precio_total ? Math.round(e.precio_total) : null;
                    const canalColor = CANAL_COLORS[canal] || C.textMid;
                    return (
                      <tr key={i} style={{ background: i%2===0?"transparent":C.redLight+"66" }}>
                        <td style={{ ...tdS, color:C.text, fontWeight:600 }}>{fmtFecha(e.fecha_llegada)}</td>
                        <td style={{ ...tdS, color:canalColor, fontWeight:700 }}>{canal}</td>
                        <td style={{ ...tdS, textAlign:"right", fontWeight:800, color:C.red }}>{adr !== null ? `€${adr.toLocaleString("es-ES")}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </Card>

        {/* Col derecha: ADR / DURACIÓN MEDIA POR CANAL */}
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
            <div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:16, color:C.text }}>
                {canalMetric === "adr" ? t("precio_medio_reserva") : t("duracion_media")}
              </p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>
                {canalMetric === "adr" ? t("revenue_medio") : t("noches_reserva")}
              </p>
            </div>
            <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                {[["adr","ADR"], ["noches","Noches"]].map(([key, label]) => (
                  <button key={key} onClick={() => setCanalMetric(key)}
                    style={{ padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer", border:"none", background: canalMetric===key ? C.accent : "transparent", color: canalMetric===key ? "#fff" : C.textMid, transition:"background 0.2s" }}>
                    {label}
                  </button>
                ))}
            </div>
          </div>
          {(() => {
            const rawData = canalMetric === "adr" ? precioCanalData : nochesCanalData.map(d => ({ ...d, color: CANAL_COLORS[d.canal]||C.accent }));
            if (rawData.length === 0) return <p style={{ fontSize:12, color:C.textLight, textAlign:"center", padding:"30px 0" }}>{t("sin_datos")}</p>;
            const chartData = rawData.slice(0,7).map(d => ({
              canal: d.canal,
              valor: canalMetric === "adr" ? d.media : parseFloat(d.media),
              color: d.color || CANAL_COLORS[d.canal] || C.accent
            }));
            const maxVal = Math.max(...chartData.map(d=>d.valor));
            const yMax   = canalMetric === "adr"
              ? Math.ceil(maxVal * 1.15 / 50) * 50
              : Math.ceil(maxVal * 1.3);
            const fmt = v => canalMetric === "adr" ? `€${v.toLocaleString("es-ES")}` : `${v}n`;
            return (
              <div onMouseDown={e=>e.preventDefault()}>
              <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top:16, right:16, left:8, bottom:8 }}>
                <defs>
                  {chartData.map((d,i) => (
                    <linearGradient key={i} id={`cg_${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={d.color} stopOpacity={1}/>
                      <stop offset="100%" stopColor={d.color} stopOpacity={0.55}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" opacity={1}/>
                <XAxis dataKey="canal" tick={{ fill:C.textMid, fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0, yMax]} tickFormatter={fmt} tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} width={44}/>
                <Tooltip
                  formatter={(v) => [fmt(v), canalMetric==="adr"?"ADR":"Noches"]}
                  contentStyle={{ background:"#0A2540", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12 }}
                  labelStyle={{ color:"#D4A017", fontWeight:700 }}
                  itemStyle={{ color:"#ffffff" }}
                  cursor={false}
                />
                <Bar dataKey="valor" radius={[4,4,0,0]} maxBarSize={56} shape={(p) => <SimpleBar {...p}/>}>
                  {chartData.map((d,i) => (
                    <Cell key={i} fill={`url(#cg_${i})`}/>
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
              </div>
            );
          })()}
        </div>{/* fin col derecha */}
      </div>{/* fin grid 2 cols */}

      {/* PICKUP TRIMESTRAL — ancho completo */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[[t("otb_actual"), COL_OTB], [t("nav_budget"), COL_PPTO], [t("anio_anterior"), COL_LY]].map(([label, color]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:14, height:14, background:color, borderRadius:2 }} />
                <span style={{ fontSize:12, fontWeight:600, color:C.textMid }}>{label}</span>
              </div>
            ))}
          </div>
          {trimSel !== null && (
            <button onClick={() => setTrimSel(null)}
              style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:11, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              ← Volver
            </button>
          )}
        </div>

        {!hayDatos ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:C.textLight, fontSize:13 }}>
            {t("sin_datos_pickup")}
          </div>
        ) : (() => {
          const vista = trimSel !== null ? datosDetalle : datosGrafica;
          const vMax  = Math.ceil(Math.max(...vista.map(d => Math.max(d.otb||0, d.ppto||0, d.ly||0)), 10) * 1.15 / 10) * 10;
          const bH    = (val) => val && vMax > 0 ? `${Math.min((val/vMax)*100, 100)}%` : "0%";
          return (
          <div style={{ display:"flex", gap:0, alignItems:"flex-end", height:340, position:"relative" }}>
            {[0,25,50,75,100].map(p => (
              <div key={p} style={{ position:"absolute", left:0, right:0, bottom:`${p}%`, display:"flex", alignItems:"center" }}>
                <span style={{ fontSize:10, color:C.textLight, lineHeight:1, width:36, flexShrink:0 }}>{Math.round(vMax * p / 100)}</span>
              </div>
            ))}
            <div style={{ display:"flex", flex:1, alignItems:"flex-end", height:"100%", paddingLeft:40, gap: trimSel !== null ? 48 : 32 }}>
              {vista.map((d, i) => (
                <div key={i}
                  onClick={() => trimSel === null && setTrimSel(i)}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end", gap:2, cursor: trimSel === null ? "pointer" : "default" }}
                  title={trimSel === null ? `Ver desglose ${d.mes}` : ""}>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:3, width:"100%", height:"calc(100% - 22px)", justifyContent:"center" }}>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.otb > 0 && <span style={{ fontSize:9, fontWeight:700, color:COL_OTB, marginBottom:2, lineHeight:1 }}>{d.otb}</span>}
                      <div title={`OTB: ${d.otb||0}`} style={{ width:"100%", height:bH(d.otb), background:`linear-gradient(to top, ${COL_OTB}88, ${COL_OTB})`, borderRadius:"4px 4px 0 0", minHeight:d.otb>0?4:0, transition:"height 0.3s" }} />
                    </div>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.ppto > 0 && <span style={{ fontSize:9, fontWeight:700, color:COL_PPTO, marginBottom:2, lineHeight:1 }}>{d.ppto}</span>}
                      <div title={`Ppto: ${d.ppto||0}`} style={{ width:"100%", height:bH(d.ppto), background:`linear-gradient(to top, ${COL_PPTO}88, ${COL_PPTO})`, borderRadius:"4px 4px 0 0", minHeight:d.ppto>0?4:0, transition:"height 0.3s" }} />
                    </div>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.ly > 0 && <span style={{ fontSize:9, fontWeight:700, color:COL_LY, marginBottom:2, lineHeight:1 }}>{d.ly}</span>}
                      <div title={`LY: ${d.ly||0}`} style={{ width:"100%", height:bH(d.ly), background:`linear-gradient(to top, ${COL_LY}88, ${COL_LY})`, borderRadius:"4px 4px 0 0", minHeight:d.ly>0?4:0, transition:"height 0.3s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, marginTop:6, color: trimSel === null ? COL_OTB : C.textLight }}>{d.mes}</span>
                </div>
              ))}
            </div>
          </div>
          );
        })()}
      </Card>

      {/* ── PACE ── */}
      {(() => {
        const pad = n => String(n).padStart(2,"0");
        const hab = datos.hotel?.habitaciones || 30;

        // 6 meses desde el mes actual
        const filasPace = Array.from({ length: 6 }, (_, i) => {
          const d    = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
          const a    = d.getFullYear();
          const m    = d.getMonth() + 1;
          const key  = `${a}-${pad(m)}`;
          const diasMes = new Date(a, m, 0).getDate();
          const esFuturo = a > hoy.getFullYear() || (a === hoy.getFullYear() && m > hoy.getMonth() + 1);

          // OTB actual
          const otb = otbPorMes[key] || 0;
          // LY real (produccion)
          const lyDatos = (produccion || []).filter(r => {
            const f = new Date(r.fecha + "T00:00:00");
            return f.getFullYear() === a-1 && f.getMonth()+1 === m;
          });
          const lyHabOcu = lyDatos.reduce((s,r) => s + (r.hab_ocupadas||0), 0);
          const lyHabDis = lyDatos.reduce((s,r) => s + (r.hab_disponibles||0), 0);
          const lyOcc    = lyHabDis > 0 ? (lyHabOcu / lyHabDis * 100) : null;
          const lyRevHab = lyDatos.reduce((s,r) => s + (r.revenue_hab||0), 0);
          const lyAdr    = lyHabOcu > 0 ? (lyRevHab / lyHabOcu) : null;

          // Presupuesto
          const pp = (presupuesto || []).find(p => p.anio === a && p.mes === m);
          const ppOcc = pp?.occ_ppto || null;
          const ppAdr = pp?.adr_ppto || null;

          // OCC OTB estimada (reservas / (hab * días))
          const otbOcc = hab > 0 ? (otb / (hab * diasMes) * 100) : null;

          // Diferencias
          const diffLY   = lyOcc != null && otbOcc != null ? (otbOcc - lyOcc).toFixed(1) : null;
          const diffPpto = ppOcc != null && otbOcc != null ? (otbOcc - ppOcc).toFixed(1) : null;

          return {
            label: MESES[d.getMonth()] + " " + a,
            esFuturo,
            otb,
            otbOcc: otbOcc != null ? otbOcc.toFixed(1) : null,
            lyOcc:  lyOcc  != null ? lyOcc.toFixed(1)  : null,
            lyAdr:  lyAdr  != null ? Math.round(lyAdr) : null,
            ppOcc:  ppOcc  != null ? ppOcc.toFixed(1)  : null,
            ppAdr:  ppAdr  != null ? Math.round(ppAdr) : null,
            diffLY,
            diffPpto,
          };
        });

        const hayPace = filasPace.some(f => f.otb > 0 || f.lyOcc || f.ppOcc);
        if (!hayPace) return null;

        const colorDiff = v => v == null ? C.textLight : parseFloat(v) >= 0 ? "#2ECC71" : "#E74C3C";
        const fmtDiff   = v => v == null ? "—" : `${parseFloat(v)>=0?"+":""}${v}%`;

        return (
          <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"18px 24px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"baseline", gap:10 }}>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:C.text, margin:0 }}>{t("pace_title")}</h3>
              <span style={{ fontSize:11, color:C.textLight }}>{t("pace_sub")}</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    <th style={{ padding:"9px 16px", textAlign:"left",   color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8, whiteSpace:"nowrap" }}>Mes</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OTB Res.</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:"#B8860B",   fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC OTB</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>ADR LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>ADR Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>vs LY</th>
                    <th style={{ padding:"9px 16px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>vs Ppto</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPace.map((f, i) => (
                    <tr key={i} style={{ borderTop:`1px solid ${C.border}`, background: i===0 ? C.accentLight : "transparent" }}>
                      <td style={{ padding:"10px 16px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>
                        {f.label}
                        {f.esFuturo && <span style={{ marginLeft:6, fontSize:9, background:"#2C3E7A22", color:"#7A9CC8", borderRadius:3, padding:"1px 5px", fontWeight:700 }}>OTB</span>}
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.otb > 0 ? f.otb : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:"#B8860B" }}>{f.otbOcc != null ? `${f.otbOcc}%` : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.lyOcc  != null ? `${f.lyOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.lyAdr  != null ? `€${f.lyAdr}`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.ppOcc  != null ? `${f.ppOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.ppAdr  != null ? `€${f.ppAdr}`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:colorDiff(f.diffLY)   }}>{fmtDiff(f.diffLY)}</td>
                      <td style={{ padding:"10px 16px", textAlign:"right", fontWeight:700, color:colorDiff(f.diffPpto) }}>{fmtDiff(f.diffPpto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}



    </div>
  );
}

// ─── BUDGET VIEW ──────────────────────────────────────────────────
function BudgetView({ datos, anio: anioProp }) {
  const t = useT();
  const { produccion, presupuesto } = datos;
  const pickupEntries = datos.pickupEntries || [];

  const aniosDisponibles = [...new Set((presupuesto || []).map(p => p.anio))].sort();
  const [anio, setAnio] = useState(() => aniosDisponibles.includes(anioProp) ? anioProp : (aniosDisponibles[aniosDisponibles.length - 1] || anioProp));
  const [kpiChart, setKpiChart] = useState("revenue");

  if (!presupuesto || presupuesto.length === 0) {
    return <EmptyState mensaje={t("budget_empty")} />;
  }

  const hoy = new Date();
  const pad = n => String(n).padStart(2, "0");
  const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;

  // ── FORECAST (OTB + ETP) ──────────────────────────────────────
  const calcForecastRevenue = (mesIdx, anioF) => {
    const primerDia = new Date(anioF, mesIdx, 1);
    const ultimoDia = new Date(anioF, mesIdx + 1, 0);
    const mesStr    = `${anioF}-${pad(mesIdx + 1)}`;
    const mesStrLY  = `${anioF - 1}-${pad(mesIdx + 1)}`;

    // Mes ya cerrado → no se recalcula; el forecast se recupera de localStorage
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (ultimoDia < hoyMidnight) return null;

    // ADR medio del año anterior para este mes
    const diasLY = (produccion || []).filter(r => String(r.fecha || "").slice(0, 7) === mesStrLY);
    const habOcuLY = diasLY.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const revHabLY = diasLY.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const adrLY = habOcuLY > 0 ? revHabLY / habOcuLY : null;
    if (!adrLY) return null;

    // OTB actual: reservas en pickup con fecha_llegada en este mes y fecha_pickup <= hoy
    const otbRes = pickupEntries
      .filter(e => String(e.fecha_llegada || "").slice(0, 7) === mesStr && String(e.fecha_pickup || "").slice(0, 10) <= hoyStr)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // OTB año anterior en la misma fecha relativa
    const hoyLY = `${anioF - 1}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
    const otbResLY = pickupEntries
      .filter(e => String(e.fecha_llegada || "").slice(0, 7) === mesStrLY && String(e.fecha_pickup || "").slice(0, 10) <= hoyLY)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // ETP: pickup del año anterior desde hoy hasta fin de mes, ajustado por pace
    const finMesLY = `${anioF - 1}-${pad(mesIdx + 1)}-${pad(ultimoDia.getDate())}`;
    const etpResLY = pickupEntries
      .filter(e => {
        const fp = String(e.fecha_pickup || "").slice(0, 10);
        return String(e.fecha_llegada || "").slice(0, 7) === mesStrLY && fp > hoyLY && fp <= finMesLY;
      })
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // Factor pace — limitado a máx 1.5x para evitar distorsiones por falta de datos LY
    const paceRaw = otbResLY > 20 ? otbRes / otbResLY : 1;
    const paceFactor = Math.min(1.5, Math.max(0.5, paceRaw));
    const etpRes = Math.round(etpResLY * paceFactor);

    // Forecast reservas totales = OTB + ETP
    const forecastRes = otbRes + etpRes;

    // Revenue forecast = reservas * ADR año anterior
    const forecastRev = Math.round(forecastRes * adrLY);

    // ADR forecast = ADR del año anterior (es el ADR implícito en el modelo)
    const forecastAdr = Math.round(adrLY);

    // RevPAR forecast = forecastRev / hab_disponibles del año anterior
    const habDisLY = diasLY.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const forecastRevpar = habDisLY > 0 ? Math.round(forecastRev / habDisLY) : null;

    // Confianza: % del mes transcurrido
    const diasMes    = ultimoDia.getDate();
    const diaActual  = primerDia > hoy ? 0 : Math.min(hoy.getDate(), diasMes);
    const confianza  = Math.round((diaActual / diasMes) * 100);

    return { forecastRev, forecastAdr, forecastRevpar, otbRes, etpRes, paceFactor: paceFactor.toFixed(2), confianza };
  };

  // ── REALES POR MES ────────────────────────────────────────────
  const realesPorMes = t("meses_full").map((_, i) => {
    const d = (produccion || []).filter(r => {
      const f = new Date(r.fecha + "T00:00:00");
      return f.getMonth() === i && f.getFullYear() === anio;
    });
    const habOcu = d.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const habDis = d.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const revH   = d.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const revT   = d.reduce((a, r) => a + (r.revenue_total || 0), 0);
    return {
      adr_real:       habOcu > 0 ? Math.round(revH / habOcu) : null,
      revpar_real:    habDis > 0 ? Math.round(revH / habDis) : null,
      rev_total_real: d.length > 0 ? Math.round(revT) : null,
    };
  });

  const filas = presupuesto
    .filter(p => p.anio === anio)
    .sort((a, b) => a.mes - b.mes)
    .map(p => {
      const real      = realesPorMes[p.mes - 1];
      const fcData    = calcForecastRevenue(p.mes - 1, anio);
      // Si cerrado → forecast = real; si en curso/futuro → OTB+ETP
      const ultimoDiaMes = new Date(anio, p.mes, 0);
      const hoyMidnight  = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const mesCerrado   = ultimoDiaMes < hoyMidnight;
      const fcKey = `fr_fc_${anio}_${p.mes}`;
      let forecast_rev, forecast_adr, forecast_revpar, confianza;
      if (!mesCerrado && fcData) {
        forecast_rev    = fcData.forecastRev;
        forecast_adr    = fcData.forecastAdr;
        forecast_revpar = fcData.forecastRevpar;
        confianza       = fcData.confianza;
        try { sessionStorage.setItem(fcKey, JSON.stringify({ forecast_rev, forecast_adr, forecast_revpar, confianza })); } catch(_) {}
      } else if (mesCerrado) {
        let saved = null;
        try { saved = JSON.parse(sessionStorage.getItem(fcKey)); } catch(_) {}
        forecast_rev    = saved?.forecast_rev    ?? null;
        forecast_adr    = saved?.forecast_adr    ?? null;
        forecast_revpar = saved?.forecast_revpar ?? null;
        confianza       = saved?.confianza       ?? null;
      } else {
        forecast_rev = forecast_adr = forecast_revpar = confianza = null;
      }

      const adr_dev       = real.adr_real != null       ? Math.round((real.adr_real - p.adr_ppto) * 100) / 100     : null;
      const revpar_dev    = real.revpar_real != null     ? Math.round((real.revpar_real - p.revpar_ppto) * 100) / 100 : null;
      const revtotal_dev  = real.rev_total_real != null  ? real.rev_total_real - p.rev_total_ppto : null;
      const forecast_dev  = forecast_rev != null && p.rev_total_ppto ? forecast_rev - p.rev_total_ppto : null;
      const forecast_dev_pct = forecast_dev != null && p.rev_total_ppto > 0 ? ((forecast_dev / p.rev_total_ppto) * 100).toFixed(1) : null;

      return {
        mes: t("meses_full")[p.mes - 1], mesIdx: p.mes - 1,
        adr_ppto: p.adr_ppto, adr_real: real.adr_real, adr_dev,
        adr_dev_pct: p.adr_ppto > 0 && adr_dev != null ? ((adr_dev / p.adr_ppto) * 100).toFixed(1) : null,
        revpar_ppto: p.revpar_ppto, revpar_real: real.revpar_real, revpar_dev,
        revpar_dev_pct: p.revpar_ppto > 0 && revpar_dev != null ? ((revpar_dev / p.revpar_ppto) * 100).toFixed(1) : null,
        rev_total_ppto: p.rev_total_ppto, rev_total_real: real.rev_total_real, revtotal_dev,
        revtotal_dev_pct: p.rev_total_ppto > 0 && revtotal_dev != null ? ((revtotal_dev / p.rev_total_ppto) * 100).toFixed(1) : null,
        forecast_rev, forecast_adr, forecast_revpar, forecast_dev, forecast_dev_pct, confianza, mesCerrado,
        otbRes: fcData?.otbRes, etpRes: fcData?.etpRes, paceFactor: fcData?.paceFactor,
      };
    });

  const filasConReal   = filas.filter(f => f.adr_real != null || f.revpar_real != null);
  const totalRevPpto   = filas.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevReal   = filasConReal.reduce((a, f) => a + (f.rev_total_real || 0), 0);
  const totalRevRealLY = filasConReal.reduce((a, f) => {
    const d = (produccion || []).filter(r => {
      const fe = new Date(r.fecha + "T00:00:00");
      return fe.getMonth() === f.mesIdx && fe.getFullYear() === anio - 1;
    });
    return a + d.reduce((s, r) => s + (r.revenue_total || 0), 0);
  }, 0);
  const lytdPct = totalRevRealLY > 0 ? (((totalRevReal - totalRevRealLY) / totalRevRealLY) * 100).toFixed(1) : null;
  const lytdUp  = lytdPct != null ? parseFloat(lytdPct) >= 0 : null;
  const totalRevDev    = totalRevReal - filasConReal.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevDevPct = filasConReal.length > 0 ? ((totalRevDev / filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0))*100).toFixed(1) : null;
  const totalForecast  = filas.reduce((a, f) => a + (f.forecast_rev || 0), 0);

  const mediaAdrPpto    = filas.length > 0 ? Math.round(filas.reduce((a,f)=>a+(f.adr_ppto||0),0)/filas.length) : 0;
  const mediaAdrReal    = filasConReal.length > 0 ? Math.round(filasConReal.reduce((a,f)=>a+(f.adr_real||0),0)/filasConReal.length) : null;
  const mediaRevparPpto = filas.length > 0 ? Math.round(filas.reduce((a,f)=>a+(f.revpar_ppto||0),0)/filas.length) : 0;
  const mediaRevparReal = filasConReal.length > 0 ? Math.round(filasConReal.reduce((a,f)=>a+(f.revpar_real||0),0)/filasConReal.length) : null;

  const DevBadge = ({ val, pct }) => {
    if (val == null) return <span style={{ color: C.textLight, fontSize: 11 }}>—</span>;
    const rounded = Math.round(val * 100) / 100;
    const up = rounded >= 0;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: up ? C.green : C.red }}>
          {up ? "+" : ""}{Math.abs(rounded) > 999 ? `${(rounded/1000).toFixed(1)}k` : rounded}€
        </span>
        {pct != null && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: up ? C.greenLight : C.redLight, color: up ? C.green : C.red }}>
            {up ? "+" : ""}{pct}%
          </span>
        )}
      </span>
    );
  };

  const ConfianzaBadge = ({ pct, cerrado }) => {
    if (pct == null) return null;
    if (cerrado) return <span style={{ fontSize: 9, color: C.green, fontWeight: 600 }}>{t("real_badge")}</span>;
    const color = pct >= 70 ? C.green : pct >= 40 ? "#E85D04" : C.textLight;
    return (
      <span style={{ fontSize: 9, color, fontWeight: 600, display: "block", marginTop: 2 }}>
        {pct}% {t("confianza")}
      </span>
    );
  };

  const kpiOpts = [
    { key: "revenue", label: t("rev_total_label") },
    { key: "adr",     label: "ADR" },
  ];

  const chartUnificado = filas.map(f => ({
    mes: f.mes,
    mesFull: t("meses_full")[f.mesIdx],
    Ppto: kpiChart==="revenue" ? (f.rev_total_ppto ? Math.round(f.rev_total_ppto/1000) : null)
         : kpiChart==="adr"     ? f.adr_ppto : f.revpar_ppto,
    Real: kpiChart==="revenue" ? (f.rev_total_real ? Math.round(f.rev_total_real/1000) : null)
         : kpiChart==="adr"     ? f.adr_real : f.revpar_real,
    Forecast: f.mesCerrado ? null
            : kpiChart==="revenue" && f.forecast_rev ? Math.round(f.forecast_rev / 1000)
            : kpiChart==="adr"    ? (f.forecast_adr ?? null)
            : null,
  }));

  const chartUnit  = kpiChart==="revenue" ? "k€" : "€";
  const chartTitle = kpiChart==="revenue" ? t("chart_rev")
                   : kpiChart==="adr"     ? t("chart_adr") : t("chart_revpar");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* KPIs forecast resumen */}
      {totalForecast > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { label:t("rev_real_ytd"),         value:`€${Math.round(totalRevReal).toLocaleString("es-ES")}`,    color:C.green, lytd: lytdPct },
            { label:t("forecast_cierre_anio"), value:`€${Math.round(totalForecast).toLocaleString("es-ES")}`,   color:"#B8860B" },
            { label:t("presupuesto_anio"),     value:`€${Math.round(totalRevPpto).toLocaleString("es-ES")}`,   color:C.accent },
          ].map((k,i) => (
            <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 20px", borderLeft:`3px solid ${k.color}` }}>
              <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <p style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{k.value}</p>
                {k.lytd != null && (
                  <span style={{ fontSize:10, fontWeight:600, padding:"1px 5px", borderRadius:3, background: lytdUp ? C.greenLight : C.redLight, color: lytdUp ? C.green : C.red }}>
                    {lytdUp ? "+" : ""}{k.lytd}% vs LYTD
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selector año */}
      {aniosDisponibles.length > 1 && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:12, fontWeight:600, color:C.text, background:C.bgCard, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Gráfica */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>{chartTitle}</p>
            <p style={{ fontSize:11, color:C.textLight, marginTop:3, letterSpacing:"0.3px" }}>Presupuesto · Real · Forecast &mdash; {anio}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
            <div style={{ display:"flex", gap:6 }}>
              {kpiOpts.map(o => (
                <button key={o.key} onClick={()=>setKpiChart(o.key)}
                  style={{ padding:"5px 14px", borderRadius:7, border:`1.5px solid ${kpiChart===o.key?"#1A7A3C":C.border}`, background:kpiChart===o.key?"#1A7A3C18":"transparent", color:kpiChart===o.key?"#1A7A3C":C.textLight, fontSize:12, fontWeight:kpiChart===o.key?700:400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
                  {o.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[
                { color:"#64748B", opacity:0.55, label:t("ppto_abrev") },
                { color:"#1A7A3C", opacity:1,    label:t("real_label") },
                { color:"#B8860B", opacity:0.85,  label:"Forecast" },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:item.color, opacity:item.opacity }} />
                  <span style={{ fontSize:10, color:C.textLight, fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div onMouseDown={e=>e.preventDefault()}>
        <ResponsiveContainer width="100%" height={310}>
          <BarChart data={chartUnificado} barSize={16} barGap={3} barCategoryGap="32%">
            <defs>
              <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.75}/>
              </linearGradient>
              <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B8860B" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#B8860B" stopOpacity={0.55}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
            <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit={chartUnit} width={54}/>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const colorMap = { Ppto:"#64748B", Real:"#1A7A3C", Forecast:"#B8860B" };
                const mesNombre = payload[0]?.payload?.mesFull || payload[0]?.payload?.mes || "";
                return (
                  <div style={{ background:"#0A2540", borderRadius:10, padding:"12px 16px", boxShadow:"0 8px 24px rgba(0,0,0,0.22)", minWidth:164 }}>
                    <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:700, color:"#FFFFFF", textTransform:"uppercase", letterSpacing:"1.5px" }}>{mesNombre}</p>
                    {payload.map((p, i) => p.value != null && (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, marginBottom:4 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ display:"inline-block", width:8, height:8, borderRadius:2, background:colorMap[p.dataKey] || "#888" }} />
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>{p.name}</span>
                        </span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#FFFFFF" }}>
                          €{(kpiChart==="revenue" ? Math.round(p.value*1000) : Math.round(p.value)).toLocaleString("es-ES")}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="Ppto"     name={t("ppto_abrev")} fill="#64748B" fillOpacity={0.45} radius={[4,4,0,0]} shape={(p) => <SimpleBar {...p}/>}/>
            <Bar dataKey="Real"     name={t("real_label")} fill="url(#gradReal)"     radius={[4,4,0,0]} shape={(p) => <SimpleBar {...p}/>}/>
            <Bar dataKey="Forecast" name="Forecast"         fill="url(#gradForecast)" radius={[4,4,0,0]} shape={(p) => <SimpleBar {...p}/>}/>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabla detalle */}
      <Card>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>{t("detalle_mensual")}</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                {[t("th_mes"),t("th_adr_ppto"),t("th_adr_real"),t("th_desv_adr"),t("th_revpar_ppto"),t("th_revpar_real"),t("th_desv_revpar"),t("th_rev_ppto"),t("th_rev_real"),t("th_desv_rev"),t("th_forecast")].map((h,hi) => (
                  <th key={hi} style={{ padding:"10px 14px", textAlign: hi===0?"left":"right", fontSize:10, color: hi===10?"#B8860B":C.textLight, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600, borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const esFuturo = !f.mesCerrado && f.rev_total_real == null;
                const esEnCurso = !f.mesCerrado && f.rev_total_real != null;
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0?C.bg:C.bgCard }}>
                    <td style={{ padding:"9px 14px", fontWeight:600, color:C.text }}>{f.mes}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.textMid }}>€{f.adr_ppto}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.text, fontWeight:f.adr_real?600:400 }}>{f.adr_real!=null?`€${f.adr_real}`:"—"}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right" }}><DevBadge val={f.adr_dev} pct={f.adr_dev_pct}/></td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.textMid }}>€{f.revpar_ppto}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:"#1A7A3C", fontWeight:f.revpar_real?600:400 }}>{f.revpar_real!=null?`€${f.revpar_real}`:"—"}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right" }}><DevBadge val={f.revpar_dev} pct={f.revpar_dev_pct}/></td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.textMid }}>€{f.rev_total_ppto?.toLocaleString("es-ES")}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:"#1A7A3C", fontWeight:f.rev_total_real?600:400 }}>{f.rev_total_real!=null?`€${f.rev_total_real.toLocaleString("es-ES")}`:"—"}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right" }}><DevBadge val={f.revtotal_dev} pct={f.revtotal_dev_pct}/></td>
                    <td style={{ padding:"9px 14px", textAlign:"right", background: f.mesCerrado?"transparent":"#FFF8E7", borderLeft:`2px solid ${f.forecast_rev?"#B8860B44":"transparent"}` }}>
                      {f.forecast_rev != null ? (
                        <div>
                          <span style={{ fontSize:13, fontWeight:700, color:"#B8860B" }}>€{Math.round(f.forecast_rev).toLocaleString("es-ES")}</span>
                          {f.forecast_dev != null && (
                            <span style={{ fontSize:9, color:f.forecast_dev>=0?C.green:C.red, fontWeight:600, display:"block" }}>
                              {f.forecast_dev>=0?"+":""}{(f.forecast_dev/1000).toFixed(1)}k {t("vs_ppto")}
                            </span>
                          )}
                          <ConfianzaBadge pct={f.confianza} cerrado={f.mesCerrado}/>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {filasConReal.length > 0 && (
                <tr style={{ borderTop:`2px solid ${C.border}`, background: C.greenLight, fontWeight:700 }}>
                  <td style={{ padding:"10px 14px", color:C.text, fontWeight:700 }}>{t("total_ytd")}</td>
                  <td colSpan={2} style={{ padding:"10px 14px", textAlign:"right", color:C.textMid, fontSize:11 }}>Ppto: €{mediaAdrPpto} media</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}><DevBadge val={mediaAdrReal!=null?mediaAdrReal-mediaAdrPpto:null} pct={mediaAdrReal!=null?(((mediaAdrReal-mediaAdrPpto)/mediaAdrPpto)*100).toFixed(1):null}/></td>
                  <td colSpan={2} style={{ padding:"10px 14px", textAlign:"right", color:C.textMid, fontSize:11 }}>Ppto: €{mediaRevparPpto} media</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}><DevBadge val={mediaRevparReal!=null?mediaRevparReal-mediaRevparPpto:null} pct={mediaRevparReal!=null?(((mediaRevparReal-mediaRevparPpto)/mediaRevparPpto)*100).toFixed(1):null}/></td>
                  <td style={{ padding:"10px 14px", textAlign:"right", color:C.textMid, fontSize:11 }}>€{Math.round(filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0)).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right", color:"#1A7A3C", fontWeight:700 }}>€{Math.round(totalRevReal).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}><DevBadge val={Math.round(totalRevDev)} pct={totalRevDevPct}/></td>
                  <td style={{ padding:"10px 14px", textAlign:"right", background:"#FFF8E7", borderLeft:"2px solid #B8860B44" }}>
                    {totalForecast > 0 && <span style={{ fontSize:13, fontWeight:700, color:"#B8860B" }}>€{Math.round(totalForecast).toLocaleString("es-ES")}</span>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}


// ─── GRUPOS & EVENTOS VIEW ────────────────────────────────────────
function GruposView({ datos, onRecargar }) {
  const t = useT();
  const grupos = datos.grupos || [];
  const session = datos.session;

  const CATS = {
    corporativo: { label: t("cat_corporativo"), color: "#2B7EC1" },
    boda:        { label: t("cat_boda"),        color: "#D4547A" },
    feria:       { label: t("cat_feria"),       color: "#E85D04" },
    deportivo:   { label: t("cat_deportivo"),   color: "#059669" },
    otros:       { label: t("cat_otros"),       color: "#7C3AED" },
  };

  const ESTADOS = {
    confirmado:  { label: t("estado_confirmado"), color: "#1A7A3C", bg: "#E6F7EE", peso: 1.0 },
    tentativo:   { label: t("estado_tentativo"),  color: "#B8860B", bg: "#FFF8E7", peso: 0.5 },
    cotizacion:  { label: t("estado_cotizacion"), color: "#2B7EC1", bg: "#E8F0F9", peso: 0 },
    cancelado:   { label: t("estado_cancelado"),  color: "#999",    bg: "#F5F5F5", peso: 0 },
  };

  const MESES = t("meses_corto");
  const MESES_FULL = t("meses_full");

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth());
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [modalGrupo, setModalGrupo] = useState(null); // null | {} (nuevo) | {id,...} (editar)
  const [detalleGrupo, setDetalleGrupo] = useState(null); // evento para panel de métricas
  const [guardando, setGuardando] = useState(false);
  const [vistaActiva, setVistaActiva] = useState("calendario"); // calendario | tabla
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (modalGrupo)    { setModalGrupo(null); return; }
      if (detalleGrupo)  { setDetalleGrupo(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalGrupo, detalleGrupo]);

  const prevMes = () => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); };

  // ── Formulario estado ──
  const FORM_VACIO = { nombre:"", categoria:"corporativo", estado:"cotizacion", fecha_inicio:"", fecha_fin:"", fecha_confirmacion:"", habitaciones:"", pax:"", adr_grupo:"", revenue_fnb:"", revenue_sala:"", notas:"", motivo_perdida:"" };
  const [form, setForm] = useState(FORM_VACIO);

  const abrirNuevo = (fecha = "") => {
    setForm({ ...FORM_VACIO, fecha_inicio: fecha, fecha_fin: fecha });
    setModalGrupo({});
  };

  const abrirEditar = (g) => {
    setForm({
      nombre: g.nombre||"", categoria: g.categoria||"corporativo", estado: g.estado||"cotizacion",
      fecha_inicio: g.fecha_inicio||"", fecha_fin: g.fecha_fin||"", fecha_confirmacion: g.fecha_confirmacion||"",
      habitaciones: g.habitaciones||"", pax: g.pax||"", adr_grupo: g.adr_grupo||"",
      revenue_fnb: g.revenue_fnb||"", revenue_sala: g.revenue_sala||"",
      notas: g.notas||"", motivo_perdida: g.motivo_perdida||"",
    });
    setModalGrupo(g);
  };

  const guardar = async () => {
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) return;
    setGuardando(true);
    const payload = {
      hotel_id: session.user.id,
      nombre: form.nombre,
      categoria: form.categoria,
      estado: form.estado,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      habitaciones: parseInt(form.habitaciones)||0,
      pax: parseInt(form.pax)||0,
      adr_grupo: parseFloat(form.adr_grupo)||0,
      revenue_fnb: parseFloat(form.revenue_fnb)||0,
      revenue_sala: parseFloat(form.revenue_sala)||0,
      fecha_confirmacion: form.fecha_confirmacion||null,
      notas: form.notas||null,
      motivo_perdida: form.motivo_perdida||null,
    };
    if (modalGrupo?.id) {
      await supabase.from("grupos_eventos").update(payload).eq("id", modalGrupo.id);
    } else {
      await supabase.from("grupos_eventos").insert(payload);
    }
    setGuardando(false);
    setModalGrupo(null);
    onRecargar();
  };

  const eliminar = async (id) => {
    if (!window.confirm(t("eliminar_grupo"))) return;
    await supabase.from("grupos_eventos").delete().eq("id", id);
    setModalGrupo(null);
    onRecargar();
  };

  const calcRevTotal = (g) => {
    const noches = g.fecha_inicio && g.fecha_fin
      ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
      : 1;
    return (g.habitaciones||0) * (g.adr_grupo||0) * noches + (g.revenue_fnb||0) + (g.revenue_sala||0);
  };

  // ── Cálculos KPIs del mes activo ──
  const gruposAnio = grupos.filter(g => g.fecha_inicio?.slice(0,4) === String(anio) || g.fecha_fin?.slice(0,4) === String(anio));
  const mesStr = String(anio) + "-" + String(mes + 1).padStart(2, "0");
  const gruposMes = grupos.filter(g => g.fecha_inicio?.slice(0,7) === mesStr || g.fecha_fin?.slice(0,7) === mesStr);
  const confirmados = gruposMes.filter(g => g.estado === "confirmado");
  const tentativos  = gruposMes.filter(g => g.estado === "tentativo");
  const pipeline    = gruposMes.filter(g => g.estado === "cotizacion");
  const cancelados  = gruposMes.filter(g => g.estado === "cancelado");

  const revConfirmado = confirmados.reduce((a,g) => a + calcRevTotal(g), 0);
  const revTentativo  = tentativos.reduce((a,g)  => a + calcRevTotal(g) * 0.5, 0);
  const revPipeline   = pipeline.reduce((a,g)    => a + calcRevTotal(g), 0);

  // ── Datos para gráfico de evolución anual ──
  const produccion = datos.produccion || [];
  const chartRevMensual = MESES.map((_, mi) => {
    const mStr = String(anio) + "-" + String(mi + 1).padStart(2, "0");
    const diasMes = produccion.filter(d => d.fecha?.slice(0,7) === mStr);
    const revHab = diasMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
    const revME  = grupos
      .filter(g => g.estado === "confirmado" && g.fecha_inicio?.slice(0,7) === mStr)
      .reduce((a, g) => a + calcRevTotal(g), 0);
    const tieneDatos = diasMes.length > 0;
    return { mes: MESES[mi], revHab: tieneDatos ? Math.round(revHab) : null, revME: revME > 0 ? Math.round(revME) : null };
  });

  const gruposFiltrados = filtroEstado === "todos"
    ? gruposAnio.filter(g => g.estado !== "cancelado")
    : gruposAnio.filter(g => g.estado === filtroEstado);

  const inp = { width:"100%", padding:"9px 12px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Toolbar ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {/* Navegación mes (solo en vista calendario) */}
          {vistaActiva === "calendario" ? (<>
            <button onClick={prevMes} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, padding:0 }}>‹</button>
            <span style={{ fontSize:14, fontWeight:700, color:C.text, minWidth:120, textAlign:"center" }}>{MESES_FULL[mes]} {anio}</span>
            <button onClick={nextMes} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, padding:0 }}>›</button>
          </>) : (<>
            <button onClick={()=>setAnio(a=>a-1)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, padding:0 }}>‹</button>
            <span style={{ fontSize:14, fontWeight:700, color:C.text, minWidth:40, textAlign:"center" }}>{anio}</span>
            <button onClick={()=>setAnio(a=>a+1)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, padding:0 }}>›</button>
          </>)}
          {/* Selector vista */}
          <select value={vistaActiva} onChange={e=>setVistaActiva(e.target.value)}
            style={{ marginLeft:8, padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:12, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
            {[["calendario","📅 Calendario"],["tabla","⊞ Tabla"]].map(([k,label])=>(
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <button onClick={()=>abrirNuevo()} style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          {t("nuevo_evento")}
        </button>
      </div>

      {/* ── VISTA CALENDARIO — lista eventos del mes ── */}
      {vistaActiva === "calendario" && (() => {
        const mesIni = new Date(anio, mes, 1);
        const mesFin = new Date(anio, mes + 1, 0);
        const evsMes = grupos
          .filter(g => {
            if (!g.fecha_inicio || !g.fecha_fin) return false;
            const ini = new Date(g.fecha_inicio + "T00:00:00");
            const fin = new Date(g.fecha_fin + "T00:00:00");
            return ini <= mesFin && fin >= mesIni;
          })
          .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

        return (
          <Card>
            {evsMes.length === 0
              ? <p style={{ textAlign:"center", color:C.textLight, padding:"32px 0", fontSize:13 }}>No hay eventos disponibles</p>
              : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {evsMes.map(g => {
                    const noches = g.fecha_inicio && g.fecha_fin
                      ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
                      : 1;
                    return (
                      <div key={g.id} onClick={() => setDetalleGrupo(g)}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", transition:"border-color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = ESTADOS[g.estado]?.color || "#7C3AED"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.nombre}</p>
                          <p style={{ fontSize:11, color:C.textLight }}>{g.fecha_inicio} → {g.fecha_fin} · {noches} noche{noches !== 1 ? "s" : ""} · {g.habitaciones || 0} hab.</p>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color, whiteSpace:"nowrap", flexShrink:0 }}>
                          {ESTADOS[g.estado]?.label}
                        </span>
                        <p style={{ fontSize:13, fontWeight:800, color:"#1A7A3C", whiteSpace:"nowrap", flexShrink:0 }}>€{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}</p>
                      </div>
                    );
                  })}
                </div>
            }
          </Card>
        );
      })()}

      {/* ── PRÓXIMOS EVENTOS CONFIRMADOS ── */}
      {(() => {
        const hoyStr = new Date().toISOString().slice(0, 10);
        const proximos = grupos
          .filter(g => g.estado === "confirmado" && g.fecha_inicio >= hoyStr)
          .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
          .slice(0, 3);
        return (
          <Card>
            <p style={{ fontSize:12, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:12 }}>Próximos eventos confirmados</p>
            {proximos.length === 0
              ? <p style={{ textAlign:"center", color:C.textLight, padding:"20px 0", fontSize:13 }}>No hay eventos confirmados próximos</p>
              : <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr>
                        {["Evento","Entrada","Salida","Noches","Habs","ADR","Revenue"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {proximos.map((g, i) => {
                        const noches = g.fecha_inicio && g.fecha_fin
                          ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
                          : 1;
                        return (
                          <tr key={g.id} onClick={() => setDetalleGrupo(g)}
                            style={{ borderBottom:`1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard, cursor:"pointer" }}
                            onMouseEnter={e => e.currentTarget.style.background = C.accentLight}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.bg : C.bgCard}>
                            <td style={{ padding:"9px 14px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                            <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_inicio}</td>
                            <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_fin}</td>
                            <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{noches}</td>
                            <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.habitaciones || 0}</td>
                            <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.adr_grupo || 0).toLocaleString("es-ES")}</td>
                            <td style={{ padding:"9px 14px", fontWeight:700, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>€{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            }
          </Card>
        );
      })()}

      {/* ── VISTA TABLA ── */}
      {vistaActiva === "tabla" && (
        <Card>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr>
                  {["Evento","Estado","Entrada","Salida","Noches","Habs","PAX","ADR","F&B","Sala","Revenue total","Notas"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gruposAnio.length === 0
                  ? <tr><td colSpan={12} style={{ padding:24, textAlign:"center", color:C.textLight }}>{t("sin_eventos")}</td></tr>
                  : gruposAnio.sort((a,b)=>a.fecha_inicio?.localeCompare(b.fecha_inicio)).map((g, i) => {
                      const noches = g.fecha_inicio && g.fecha_fin
                        ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
                        : 1;
                      return (
                        <tr key={g.id} onClick={()=>setDetalleGrupo(g)} style={{ borderBottom:`1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard, cursor:"pointer" }}
                          onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                          onMouseLeave={e=>e.currentTarget.style.background= i % 2 === 0 ? C.bg : C.bgCard}>
                          <td style={{ padding:"9px 14px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>
                            {g.nombre}
                          </td>
                          <td style={{ padding:"9px 14px" }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color, whiteSpace:"nowrap" }}>
                              {ESTADOS[g.estado]?.label}
                            </span>
                          </td>
                          <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_inicio||"—"}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_fin||"—"}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{noches}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.habitaciones||0}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.pax||0}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.adr_grupo||0).toLocaleString("es-ES")}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_fnb||0).toLocaleString("es-ES")}</td>
                          <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_sala||0).toLocaleString("es-ES")}</td>
                          <td style={{ padding:"9px 14px", fontWeight:700, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>
                            €{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}
                          </td>
                          <td style={{ padding:"9px 14px", color:C.textLight, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.notas||"—"}</td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── GRÁFICO EVOLUCIÓN REVENUE ANUAL ── */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>Evolución Revenue</p>
            <p style={{ fontSize:11, color:C.textLight, marginTop:3, letterSpacing:"0.3px" }}>Habitaciones · Grupos/Eventos — {anio}</p>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            {[
              { color:"#1A7A3C", label:"Habitaciones" },
              { color:"#B8860B", label:"Grupos/Eventos" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:item.color }}/>
                <span style={{ fontSize:10, color:C.textLight, fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartRevMensual} barSize={20} barCategoryGap="32%" margin={{ top:4, right:8, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="gradHabGrupos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="gradME" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B8860B" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#B8860B" stopOpacity={0.55}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.textLight }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.textLight }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k€` : `€${v}`} width={48} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="revHab" stackId="a" fill="url(#gradHabGrupos)" radius={[0,0,0,0]} name="Habitaciones" activeBar={false}/>
            <Bar dataKey="revME"  stackId="a" fill="url(#gradME)"        radius={[4,4,0,0]} name="Grupos/Eventos" activeBar={false}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── PANEL DETALLE EVENTO (desde calendario) ── */}
      {detalleGrupo !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setDetalleGrupo(null)}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"95vw", maxWidth:1100, maxHeight:"90vh", overflow:"auto", padding:"28px 36px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>

            {/* Cabecera */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>{detalleGrupo.nombre}</h3>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:10, background:ESTADOS[detalleGrupo.estado]?.bg, color:ESTADOS[detalleGrupo.estado]?.color }}>
                  {ESTADOS[detalleGrupo.estado]?.label}
                </span>
              </div>
              <button onClick={()=>setDetalleGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
            </div>

            {/* Tabla de métricas — mismo estilo que vista Tabla */}
            {(() => {
              const g = detalleGrupo;
              const noches = g.fecha_inicio && g.fecha_fin
                ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
                : 1;
              return (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                    <thead>
                      <tr>
                        {["Evento","Estado","Entrada","Salida","Noches","Habs","PAX","ADR","F&B","Sala","Revenue total","Notas"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom:`1px solid ${C.border}`, background: C.bg }}>
                        <td style={{ padding:"9px 14px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                        <td style={{ padding:"9px 14px" }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color, whiteSpace:"nowrap" }}>
                            {ESTADOS[g.estado]?.label}
                          </span>
                        </td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_inicio||"—"}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_fin||"—"}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{noches}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.habitaciones||0}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.pax||0}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.adr_grupo||0).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_fnb||0).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_sala||0).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"9px 14px", fontWeight:800, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>
                          €{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}
                        </td>
                        <td style={{ padding:"9px 14px", color:C.textLight }}>{g.notas||"—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Botón editar */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={()=>{ setDetalleGrupo(null); abrirEditar(detalleGrupo); }}
                style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:7, padding:"9px 22px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                ✏️ Editar evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULARIO ── */}
      {modalGrupo !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setModalGrupo(null)}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:540, maxHeight:"90vh", overflow:"auto", padding:"28px 32px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>{modalGrupo?.id?t("editar_evento"):t("nuevo_evento_title")}</h3>
              <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_nombre")}</p>
                <input style={inp} placeholder="Boda García · Congreso Pharma..." value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_categoria")}</p>
                  <select style={inp} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                    {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_estado")}</p>
                  <select style={inp} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_entrada")}</p>
                  <input style={inp} type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_salida")}</p>
                  <input style={inp} type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))}/>
                </div>
              </div>

              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_confirmacion")}</p>
                <input style={inp} type="date" value={form.fecha_confirmacion} onChange={e=>setForm(f=>({...f,fecha_confirmacion:e.target.value}))}/>
              </div>

              {form.fecha_inicio && form.fecha_fin && (() => {
                const noches = Math.max(0, Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000));
                return noches > 0 ? (
                  <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"7px 12px", fontSize:12, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:700, color:C.text }}>{noches}</span> noche{noches !== 1 ? "s" : ""} de duración
                  </div>
                ) : null;
              })()}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_habitaciones")}</p>
                  <input style={inp} type="number" placeholder="20" value={form.habitaciones} onChange={e=>setForm(f=>({...f,habitaciones:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>PAX</p>
                  <input style={inp} type="number" placeholder="40" value={form.pax} onChange={e=>setForm(f=>({...f,pax:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_adr")}</p>
                  <input style={inp} type="number" placeholder="89" value={form.adr_grupo} onChange={e=>setForm(f=>({...f,adr_grupo:e.target.value}))}/>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fnb")}</p>
                  <input style={inp} type="number" placeholder="5000" value={form.revenue_fnb} onChange={e=>setForm(f=>({...f,revenue_fnb:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_sala")}</p>
                  <input style={inp} type="number" placeholder="800" value={form.revenue_sala} onChange={e=>setForm(f=>({...f,revenue_sala:e.target.value}))}/>
                </div>
              </div>

              {form.estado === "cancelado" && (
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_motivo")}</p>
                  <input style={inp} placeholder="Precio, competencia, fecha..." value={form.motivo_perdida} onChange={e=>setForm(f=>({...f,motivo_perdida:e.target.value}))}/>
                </div>
              )}

              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_notas")}</p>
                <textarea style={{...inp, resize:"vertical", minHeight:60}} placeholder="Contacto, condiciones especiales..." value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/>
              </div>

              {/* Preview revenue */}
              {(form.habitaciones || form.revenue_fnb || form.revenue_sala) && (() => {
                const noches = form.fecha_inicio && form.fecha_fin
                  ? Math.max(1, Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000))
                  : 1;
                const revHab = (parseInt(form.habitaciones)||0) * (parseFloat(form.adr_grupo)||0) * noches;
                const revFnb = parseFloat(form.revenue_fnb)||0;
                const revSala = parseFloat(form.revenue_sala)||0;
                const total = revHab + revFnb + revSala;
                return total > 0 ? (
                  <div style={{ background:"#E6F7EE", border:"1px solid #1A7A3C33", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <p style={{ fontSize:12, color:"#1A7A3C", fontWeight:600 }}>{t("rev_estimado")}</p>
                    <p style={{ fontSize:18, fontWeight:800, color:"#1A7A3C" }}>€{Math.round(total).toLocaleString("es-ES")}</p>
                  </div>
                ) : null;
              })()}

              {/* ── ANÁLISIS DE DESPLAZAMIENTO ── */}
              {form.fecha_inicio && form.fecha_fin && (parseInt(form.habitaciones)||0) > 0 && (() => {
                const produccion  = datos.produccion  || [];
                const presupuesto = datos.presupuesto || [];
                const noches = Math.max(1, Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000));
                const rooms    = parseInt(form.habitaciones) || 0;
                const adrGrupo = parseFloat(form.adr_grupo)  || 0;
                const revFnb   = parseFloat(form.revenue_fnb)  || 0;
                const revSala  = parseFloat(form.revenue_sala) || 0;

                // Periodo LY equivalente
                const anioEvt = parseInt(form.fecha_inicio.slice(0,4));
                const iniLY   = `${anioEvt-1}${form.fecha_inicio.slice(4)}`;
                const finLY   = `${anioEvt-1}${form.fecha_fin.slice(4)}`;

                const diasLY   = produccion.filter(r => { const f = String(r.fecha||"").slice(0,10); return f >= iniLY && f <= finLY; });
                const habOcuLY = diasLY.reduce((a,r) => a+(r.hab_ocupadas||0), 0);
                const revHabLY = diasLY.reduce((a,r) => a+(r.revenue_hab||0), 0);
                const habDisLY = diasLY.reduce((a,r) => a+(r.hab_disponibles||0), 0);

                let adrTransient, factorOcc, fuenteLY = true;
                if (habOcuLY > 0) {
                  adrTransient = Math.round(revHabLY / habOcuLY);
                  factorOcc    = habDisLY > 0 ? Math.min(1, habOcuLY / habDisLY) : 0.7;
                } else {
                  // Fallback: presupuesto del mes de inicio
                  const mesIni = parseInt(form.fecha_inicio.slice(5,7));
                  const pptoM  = presupuesto.find(p => p.mes === mesIni && p.anio === anioEvt)
                              || presupuesto.find(p => p.mes === mesIni);
                  adrTransient = pptoM?.adr_ppto || null;
                  factorOcc    = 0.65;
                  fuenteLY     = false;
                }
                // Sin referencia de precio: mostrar aviso
                if (!adrTransient) return (
                  <div style={{ background:"#F5F5F5", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>📊 {t("analisis_desplazamiento")}</p>
                    <p style={{ fontSize:12, color:C.textLight }}>{t("sin_datos_ly")} — importa producción o presupuesto para activar este análisis.</p>
                  </div>
                );

                const contribucion        = rooms * adrGrupo * noches + revFnb + revSala;
                const costeDesplazamiento = rooms * adrTransient * noches * factorOcc;
                const valorNeto           = contribucion - costeDesplazamiento;
                const isPos               = adrGrupo > 0 ? valorNeto >= 0 : false;

                // ADR mínimo para que el grupo sea rentable (valor neto ≥ 0)
                const breakEvenHab = costeDesplazamiento - revFnb - revSala;
                const breakEvenAdr = rooms > 0 && noches > 0 && breakEvenHab > 0
                  ? Math.round(breakEvenHab / (rooms * noches)) : null;

                const sinAdr      = adrGrupo === 0;
                const borderColor = sinAdr ? "#2B7EC133" : isPos ? "#1A7A3C33" : "#E85D0433";
                const bgColor     = sinAdr ? "#EEF4FB"   : isPos ? "#F0FBF4"   : "#FFF8F0";

                return (
                  <div style={{ background:bgColor, border:`1px solid ${borderColor}`, borderRadius:8, padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>📊 {t("analisis_desplazamiento")}</p>
                      {!sinAdr && (
                        <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:6,
                          background: isPos ? C.greenLight : "#FDECEA", color: isPos ? C.green : C.red }}>
                          {isPos ? t("acepta_grupo") : t("revisar_grupo")}
                        </span>
                      )}
                    </div>

                    {sinAdr ? (
                      <p style={{ fontSize:12, color:"#2B7EC1", marginBottom:12 }}>
                        Rellena el ADR del grupo para ver el análisis completo.
                      </p>
                    ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                      {[
                        { label: t("contrib_grupo"),   val: `€${Math.round(contribucion).toLocaleString("es-ES")}`,        color: C.text },
                        { label: t("coste_desplaz"),   val: `€${Math.round(costeDesplazamiento).toLocaleString("es-ES")}`, color: "#E85D04" },
                        { label: t("valor_neto"),      val: `${isPos?"+":""}€${Math.round(valorNeto).toLocaleString("es-ES")}`, color: isPos ? C.green : C.red },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ background:C.bgCard, borderRadius:6, padding:"8px 10px" }}>
                          <p style={{ fontSize:10, color:C.textLight, marginBottom:3 }}>{label}</p>
                          <p style={{ fontSize:13, fontWeight:800, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    )}

                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                      <div>
                        <p style={{ fontSize:10, color:C.textLight }}>{t("adr_transient_ref")} {!fuenteLY && <span style={{ color:"#E85D04" }}>({t("fuente_ppto")})</span>}</p>
                        <p style={{ fontSize:12, fontWeight:600, color:C.textMid }}>€{adrTransient}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:10, color:C.textLight }}>{t("occ_hist_ly")}</p>
                        <p style={{ fontSize:12, fontWeight:600, color:C.textMid }}>{Math.round(factorOcc*100)}%</p>
                      </div>
                      {breakEvenAdr != null && (
                        <div>
                          <p style={{ fontSize:10, color:C.textLight }}>{t("adr_minimo_rentable")}</p>
                          <p style={{ fontSize:12, fontWeight:700, color: adrGrupo >= breakEvenAdr ? C.green : C.red }}>€{breakEvenAdr}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                {modalGrupo?.id
                  ? <button onClick={()=>eliminar(modalGrupo.id)} style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>{t("form_eliminar")}</button>
                  : <div/>
                }
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textMid, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>{t("form_cancelar")}</button>
                  <button onClick={guardar} disabled={guardando||!form.nombre||!form.fecha_inicio||!form.fecha_fin}
                    style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:7, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity:guardando?0.6:1 }}>
                    {guardando?t("guardando_btn"):t("form_guardar")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelNombre, setHotelNombre] = useState("");
  const [hotelCiudad, setHotelCiudad] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos");
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!hotelNombre || !email || !password) { setError("Rellena todos los campos obligatorios"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("hoteles").insert({ id: data.user.id, nombre: hotelNombre, ciudad: hotelCiudad, habitaciones: parseInt(habitaciones) || null });
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hotelNombre, user_id: data.user.id }),
      }).catch(() => {});
    }
    setMensaje("¡Cuenta creada! Ya puedes iniciar sesión.");
    setLoading(false);
  };

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text, background: C.bg, outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { width: 100%; min-height: 100vh; } @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ width: 420, background: C.bgCard, borderRadius: 20, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/fastrev-logo.png" alt="FastRevenue" style={{ height: 140, marginBottom: 12 }} />
        </div>
        <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([k,l]) => (
            <button key={k} onClick={() => { setMode(k); setError(""); setMensaje(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", background: mode===k ? C.bgCard : "transparent", color: mode===k ? C.accent : C.textMid, fontWeight: mode===k ? 600 : 400, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: mode===k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{l}</button>
          ))}
        </div>
        {mensaje ? (
          <div style={{ background: C.greenLight, color: C.green, padding: "14px", borderRadius: 8, fontSize: 13, textAlign: "center", fontWeight: 500 }}>{mensaje}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <>
                <div>
                  <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Nombre del hotel *</p>
                  <input style={inp} placeholder="Hotel San Marcos" value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Ciudad</p>
                    <input style={inp} placeholder="Madrid" value={hotelCiudad} onChange={e => setHotelCiudad(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Habitaciones</p>
                    <input style={inp} placeholder="45" type="number" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} />
                  </div>
                </div>
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              </>
            )}
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Email *</p>
              <input style={inp} type="email" placeholder="gerente@mihotel.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Contraseña *</p>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && (mode==="login" ? handleLogin() : handleRegister())} />
            </div>
            {error && <div style={{ background: C.redLight, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <button onClick={mode==="login" ? handleLogin : handleRegister} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? C.accentLight : C.accent, color: loading ? C.accentDark : "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4 }}>
              {loading ? "Cargando..." : mode==="login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const NAV = [
  { key: "dashboard",  icon: "◈",  labelKey: "nav_dashboard" },
  { key: "pickup",                  labelKey: "nav_pickup" },
  { key: "budget",     icon: "💰", labelKey: "nav_budget" },
  { key: "grupos",     icon: "🎪", labelKey: "nav_grupos" },
];


function PantallaSubscripcion({ session, onPagar }) {
  const t = useT();
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch(e) {
      console.error("Error al iniciar el pago:", e);
    }
    setCargando(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width:460, background:C.bgCard, borderRadius:20, padding:"48px 40px", boxShadow:"0 32px 80px rgba(0,0,0,0.1)", textAlign:"center" }}>
        <img src={LOGO_B64} alt="FastRevenue" style={{ height:52, marginBottom:24 }} />
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:10 }}>{t("empieza_gratis")}</h1>
        <p style={{ fontSize:14, color:C.textMid, lineHeight:1.7, marginBottom:32 }}>
          {t("acceso_completo")}<br/>
          {t("precio_sub")}
        </p>
        <div style={{ background:C.bg, borderRadius:12, padding:"20px 24px", marginBottom:28, textAlign:"left" }}>
          {[t("feat_dashboard"),t("feat_pickup"),t("feat_presupuesto"),t("feat_pdf")].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i<3?10:0 }}>
              <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>✓</span>
              <span style={{ fontSize:13, color:C.text }}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={iniciarPago} disabled={cargando}
          style={{ width:"100%", padding:"14px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:15, fontWeight:700, cursor:cargando?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:12 }}>
          {cargando ? t("redirigiendo") : t("empezar_prueba")}
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{ background:"none", border:"none", color:C.textLight, fontSize:12, cursor:"pointer" }}>
          {t("cerrar_sesion")}
        </button>
      </div>
    </div>
  );
}

function OnboardingOverlay({ step, onNext, onSkip }) {
  const t = useT();
  const STEPS = [
    { target: "ob-importar",      titleKey: "ob0_title", textKey: "ob0_text" },
    { target: "ob-nav-dashboard", titleKey: "ob1_title", textKey: "ob1_text" },
    { target: "ob-nav-pickup",    titleKey: "ob2_title", textKey: "ob2_text" },
    { target: "ob-nav-budget",    titleKey: "ob3_title", textKey: "ob3_text" },
    { target: "ob-nav-grupos",    titleKey: "ob4_title", textKey: "ob4_text" },
  ];

  const [rect, setRect] = useState(null);
  const s = STEPS[step];

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(s.target);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step]);

  if (!rect) return null;

  const PAD = 8;
  const sL = rect.left - PAD, sT = rect.top - PAD, sW = rect.width + PAD * 2, sH = rect.height + PAD * 2;
  const TW = 280;
  let tLeft = sL + sW / 2 - TW / 2;
  const tTop = sT + sH + 14;
  tLeft = Math.max(12, Math.min(tLeft, window.innerWidth - TW - 12));
  const arrowX = Math.max(20, Math.min((sL + sW / 2) - tLeft, TW - 20));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "default" }} onClick={onNext}>
        <defs>
          <mask id="ob-spot">
            <rect width="100%" height="100%" fill="white" />
            <rect x={sL} y={sT} width={sW} height={sH} rx={8} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(10,37,64,0.65)" mask="url(#ob-spot)" />
      </svg>
      <div style={{ position: "fixed", left: tLeft, top: tTop, width: TW, background: "#fff", borderRadius: 12, padding: "18px 20px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", animation: "fadeUp 0.2s ease" }}>
        <div style={{ position: "absolute", top: -8, left: arrowX - 8, width: 16, height: 8, overflow: "hidden" }}>
          <div style={{ width: 12, height: 12, background: "#fff", transform: "rotate(45deg)", margin: "3px auto 0", boxShadow: "-2px -2px 4px rgba(0,0,0,0.06)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1.5 }}>{t("ob_paso")} {step + 1} {t("ob_de")} {STEPS.length}</span>
          <button onClick={(e) => { e.stopPropagation(); onSkip(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.textLight, padding: 0 }}>{t("ob_omitir")}</button>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t(s.titleKey)}</p>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 16 }}>{t(s.textKey)}</p>
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {step < STEPS.length - 1 ? t("ob_siguiente") : t("ob_empezar")}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem("fr_view") || "dashboard");

  const hoy = new Date();
  const [mesSel,  setMesSel]  = useState(() => { const v = localStorage.getItem("rm_mes");  return v !== null ? parseInt(v) : hoy.getMonth(); });
  const [anioSel, setAnioSel] = useState(() => { const v = localStorage.getItem("rm_anio"); return v !== null ? parseInt(v) : hoy.getFullYear(); });
  const [importar, setImportar] = useState(false);
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargandoSub, setCargandoSub] = useState(true);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelandoSub, setCancelandoSub] = useState(false);
  const [datos, setDatos] = useState({ produccion: [], presupuesto: [] });
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // Restaurar scroll al montar
  useEffect(() => {
    const saved = localStorage.getItem("fr_scroll");
    if (saved) {
      const el = document.getElementById("main-scroll");
      if (el) el.scrollTop = parseInt(saved);
    }
  }, [datos.produccion?.length]); // restaurar cuando los datos ya están cargados

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si cambia el usuario, limpiar caché
      if (session) {
        const cachedUserId = localStorage.getItem("fr_user_id");
        if (cachedUserId && cachedUserId !== session.user.id) {
          sessionStorage.removeItem("fr_datos_cache_v3");
          sessionStorage.removeItem("fr_datos_ts_v3");
          localStorage.removeItem("fr_scroll");
          localStorage.removeItem("fr_view");
        }
        localStorage.setItem("fr_user_id", session.user.id);
      }
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      cargarDatos(false);
      // Cargar suscripción
      supabase.from("suscripciones").select("*").eq("user_id", session.user.id).maybeSingle()
        .then(({ data, error }) => {
          setSuscripcion(data || null);
          setCargandoSub(false);
        }).catch(() => { setSuscripcion(null); setCargandoSub(false); });
      // Verificar pago=ok en URL
      if (window.location.search.includes("pago=ok")) {
        setTimeout(() => {
          supabase.from("suscripciones").select("*").eq("user_id", session.user.id).maybeSingle()
            .then(({ data }) => { setSuscripcion(data); });
        }, 2000);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [session]);

  const [refreshKey, setRefreshKey] = useState(0);

  const CACHE_KEY = "fr_datos_cache_v3";
  const CACHE_TS_KEY = "fr_datos_ts_v3";

  const cargarDatos = async (forzar = false) => {
    // Si no forzamos, intentar usar caché
    if (!forzar) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        const ts = sessionStorage.getItem(CACHE_TS_KEY);
        if (cached && ts) {
          const parsed = JSON.parse(cached);
          parsed.session = session;
          setDatos(parsed);
          setCargandoDatos(false);
          // Restaurar scroll después de pintar
          setTimeout(() => {
            const el = document.getElementById("main-scroll");
            const scroll = localStorage.getItem("fr_scroll");
            if (el && scroll) el.scrollTop = parseInt(scroll);
          }, 50);
          return;
        }
      } catch(_) {}
    }

    setCargandoDatos(true);
    const [{ data: produccion }, { data: presupuesto }, { data: hotelData }, { data: gruposData }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("presupuesto").select("*").eq("hotel_id", session.user.id).order("mes"),
      supabase.from("hoteles").select("nombre, ciudad, habitaciones").eq("id", session.user.id).maybeSingle(),
      supabase.from("grupos_eventos").select("*").eq("hotel_id", session.user.id).order("fecha_inicio"),
    ]);
    // Pickup separado — carga en paralelo para máxima velocidad
    let pickupEntries = [];
    try {
      const { data: pe0, count } = await supabase.from("pickup_entries")
        .select("fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado", { count: "exact" })
        .eq("hotel_id", session.user.id)
        .range(0, 999);
      if (pe0 && pe0.length > 0) {
        const total = count || pe0.length;
        const PAGINA = 1000;
        const paginas = Math.ceil(total / PAGINA);
        const resto = paginas > 1
          ? await Promise.all(
              Array.from({ length: paginas - 1 }, (_, i) =>
                supabase.from("pickup_entries")
                  .select("fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado")
                  .eq("hotel_id", session.user.id)
                  .range((i + 1) * PAGINA, (i + 2) * PAGINA - 1)
                  .then(r => r.data || [])
              )
            )
          : [];
        pickupEntries = [...pe0, ...resto.flat()];
      }
    } catch(_) {}

    // ── Inyectar grupos confirmados como pickup sintético ──
    // Cada noche de estancia del grupo = una entrada por día con hab rooms como num_reservas
    const hoyIso = new Date().toISOString().slice(0, 10);
    const gruposConfirmados = (gruposData || []).filter(g => g.estado === "confirmado" && g.fecha_inicio && g.fecha_fin && g.fecha_confirmacion);
    const pickupGrupos = [];
    for (const g of gruposConfirmados) {
      const ini = new Date(g.fecha_inicio + "T00:00:00");
      const fin = new Date(g.fecha_fin   + "T00:00:00");
      for (let d = new Date(ini); d < fin; d.setDate(d.getDate() + 1)) {
        const fecha = d.toISOString().slice(0, 10);
        pickupGrupos.push({
          fecha_llegada:  fecha,
          fecha_pickup:   g.fecha_confirmacion || hoyIso,
          canal:          "Grupos/Eventos",
          num_reservas:   g.habitaciones || 0,
          fecha_salida:   g.fecha_fin,
          noches:         1,
          precio_total:   (g.habitaciones || 0) * (g.adr_grupo || 0),
          estado:         "confirmada",
          _grupo:         true,
        });
      }
    }
    const pickupConGrupos = [...pickupEntries, ...pickupGrupos];

    const nuevoDatos = {
      produccion: produccion || [],
      presupuesto: presupuesto || [],
      pickupEntries: pickupConGrupos,
      hotel: hotelData,
      grupos: gruposData || [],
    };

    // Guardar en caché
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(nuevoDatos));
      sessionStorage.setItem(CACHE_TS_KEY, Date.now().toString());
    } catch(_) {}

    setDatos({ ...nuevoDatos, session });
    setCargandoDatos(false);
    setRefreshKey(k => k + 1);

    // Restaurar scroll
    setTimeout(() => {
      const el = document.getElementById("main-scroll");
      const scroll = localStorage.getItem("fr_scroll");
      if (el && scroll) el.scrollTop = parseInt(scroll);
    }, 50);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const [mesDetalle, setMesDetalle] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  useEffect(() => {
    if (!mostrarPerfil) return;
    const handler = (e) => {
      if (!e.target.closest("[data-menu]")) {
        setMostrarPerfil(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mostrarPerfil]);
  const [perfilSeccion, setPerfilSeccion] = useState(null); // null | "suscripcion" | "extranets"
  const [kpiModalApp, setKpiModalApp] = useState(null);
  const [kpiModal, setKpiModal] = useState(null);

  // Escape global: cierra modales en orden de prioridad o vuelve a la vista anterior
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (kpiModal)        { setKpiModal(null); return; }
      if (importar)        { setImportar(false); return; }
      if (perfilSeccion)   { setPerfilSeccion(null); setConfirmCancelar(false); return; }
      if (mesDetalle)      { setMesDetalle(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kpiModal, importar, perfilSeccion, mesDetalle]);
  const [lang, setLang] = useState(() => localStorage.getItem("fr_lang") || "es");
  const t = useT();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(() =>
    localStorage.getItem("fr_onboarding_v1") ? null : 0
  );
  const handleOnboardingNext = () => {
    if (onboardingStep >= 4) { localStorage.setItem("fr_onboarding_v1", "1"); setOnboardingStep(null); }
    else setOnboardingStep(s => s + 1);
  };
  const handleOnboardingSkip = () => { localStorage.setItem("fr_onboarding_v1", "1"); setOnboardingStep(null); };

  const views = {
    dashboard: (props) => <DashboardView {...props} onMesDetalle={(m, a) => setMesDetalle({ mes: m, anio: a })} kpiModal={kpiModal} setKpiModal={setKpiModal} kpiModalExterno={kpiModalApp} onKpiModalExternoHandled={() => setKpiModalApp(null)} />,
    pickup:    (props) => <PickupView    {...props} />,
    budget:    (props) => <BudgetView    {...props} />,
    grupos:    (props) => <GruposView    {...props} onRecargar={() => cargarDatos(true)} />,
  };
  const View = views[view];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>{t("cargando")}</div>
    </div>
  );

  if (!session) return <AuthScreen />;
  if (!cargandoSub && (!suscripcion || suscripcion.estado === "cancelada")) return <PantallaSubscripcion session={session} />;

  return (
    <LangContext.Provider value={lang}>
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { width: 100%; min-height: 100vh; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.accentLight}; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        svg:focus, svg *:focus { outline: none !important; }
        @keyframes pulse-rayo { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes bar-fill-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes ticker { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @media (max-width: 640px) {
          /* Contenedor raíz — evita desbordamiento lateral */
          html, body, #root { overflow-x: hidden !important; max-width: 100vw !important; }
          main, #main-scroll { padding: 12px !important; width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; }

          /* Topbar */
          .topbar-fecha { display: none !important; }
          .topbar-center { left: 50% !important; }
          nav button { padding: 4px 8px !important; font-size: 11px !important; }
          header > div { padding: 0 12px !important; }

          /* KPIs 2x2, el último ocupa todo el ancho */
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .kpi-grid > div:last-child:nth-child(odd) { grid-column: 1 / -1 !important; }

          /* Selector de meses compacto */
          .meses-grid { grid-template-columns: repeat(4, 1fr) !important; min-width: unset !important; gap: 4px !important; }
          .meses-grid button { padding: 5px 2px !important; font-size: 10px !important; }

          /* Cabecera en columna */
          .dash-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }

          /* Grids en columna */
          .dash-charts-grid { grid-template-columns: 1fr !important; }

          /* Todos los grids multi-columna → 1 columna */
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="gridTemplateColumns: "1fr 1fr""] { grid-template-columns: 1fr !important; }

          /* Cards y contenedores al 100% */
          div[style*="max-width"] { max-width: 100% !important; }

          /* Recharts — altura fija en móvil para evitar colapso */
          .recharts-wrapper { width: 100% !important; }
          .recharts-wrapper svg { width: 100% !important; outline: none; }
          .recharts-wrapper svg:focus, .recharts-wrapper svg:focus-visible { outline: none; }
          .recharts-surface:focus, .recharts-surface:focus-visible { outline: none; }
          .recharts-wrapper *:focus, .recharts-wrapper *:focus-visible { outline: none; }

          /* Budget KPIs 3 cards → 1 columna */
          .budget-kpis { grid-template-columns: 1fr !important; }

          /* Pickup gráfica+pico → columna */
          .pickup-chart-row { flex-direction: column !important; gap: 16px !important; }
          .pickup-chart-row > div:first-child { border-right: none !important; border-bottom: 1px solid #E0E0E0 !important; padding-right: 0 !important; padding-bottom: 16px !important; }

          /* Tablas con scroll horizontal */
          table { font-size: 11px !important; }
          div[style*="overflowX"] { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
        }
        @media (max-width: 768px) {
          .topbar-date { display: none !important; }
          .topbar-nav-label { display: none !important; }
          .topbar-nav-icon { display: inline !important; }
          .topbar-importar-label { display: none !important; }
          .topbar-importar-icon { display: inline !important; }
          .topbar-perfil-label { display: none !important; }
        }
      `}</style>

      {/* Topbar */}
      <header style={{ background: C.bg, minHeight: 52, position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}><div style={{ width: "100%", minHeight: 52, display: "flex", alignItems: "center", padding: "0 clamp(12px, 4vw, 32px)", gap: 6, flexWrap: "nowrap" }}>
        {/* Logo centro */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/fastrev-logo.png" alt="FastRevenue" style={{ height: 92, width: "auto", transform: "scaleX(1.08)" }} />
          <span className="topbar-date" style={{ fontSize: 12, color: "#000000", fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
            {new Date().toLocaleDateString(lang === "en" ? "en-GB" : lang === "fr" ? "fr-FR" : "es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())}
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {NAV.map(n => {
            const navColor = n.key==="budget" ? "#1A7A3C" : n.key==="pickup" ? "#B8860B" : n.key==="grupos" ? "#7C3AED" : C.accent;
            const isActive = view===n.key;
            return (
              <button key={n.key} id={`ob-nav-${n.key}`} onClick={() => { setView(n.key); setMesDetalle(null); localStorage.setItem("fr_view", n.key); }}
                style={{ padding: "6px clamp(6px,2vw,16px)", borderRadius: 7, border: "none", cursor: "pointer", background: isActive ? navColor+"18" : "transparent", color: isActive ? navColor : C.textLight, fontSize: "clamp(11px,2.5vw,13px)", fontWeight: isActive ? 700 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap", outline: isActive ? `1.5px solid ${navColor}44` : "1.5px solid transparent" }}
                onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.color=C.text; } }}
                onMouseLeave={e=>{ e.currentTarget.style.color=isActive?navColor:C.textLight; }}>
                <span className="topbar-nav-label">{t(n.labelKey)}</span>
                <span style={{ display:"none" }} className="topbar-nav-icon">{t(n.labelKey).slice(0,3)}</span>
              </button>
            );
          })}
        </nav>

        {/* Botones + Email + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {view === "dashboard" && (
            <button id="ob-importar" onClick={() => setImportar(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: "nowrap", display:"flex", alignItems:"center", gap:5 }}>
              <span className="topbar-importar-label">Gestión de datos</span>
            </button>
          )}

          {/* Menú Mi Perfil */}
          <div data-menu style={{ position:"relative" }}>
            <button onClick={() => setMostrarPerfil(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 8px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.text, cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", letterSpacing:0.2 }}>
              <span style={{ width:26, height:26, borderRadius:"50%", background:C.accent, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {session.user.email[0].toUpperCase()}
              </span>
              <span className="topbar-perfil-label">{t("mi_perfil")}</span>
            </button>
            {mostrarPerfil && (
              <div style={{ position:"absolute", top:42, right:0, width:240, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 24px rgba(0,0,0,0.08)", zIndex:200, overflow:"hidden" }}>
                {/* Email */}
                <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:C.bg }}>
                  <p style={{ fontSize:11, color:C.textLight, marginBottom:2 }}>{t("conectado_como")}</p>
                  <p style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.user.email}</p>
                </div>
                {/* Opciones */}
                {[
                  { label:t("suscripcion"), key:"suscripcion" },
                  { label:t("extranets"), key:"extranets" },
                  { label:t("informe_mensual"), key:"informe" },
                ].map(op => (
                  <button key={op.key} onClick={async () => {
                      if (op.key === "informe") {
                        setMostrarPerfil(false);
                        setGenerandoPDF(true);
                        await generarReportePDF(datos, mesSel, anioSel, datos.hotel?.nombre||"Mi Hotel");
                        setGenerandoPDF(false);
                      } else {
                        setPerfilSeccion(op.key);
                        setMostrarPerfil(false);
                      }
                    }}
                    style={{ width:"100%", display:"flex", alignItems:"center", padding:"10px 16px", background:"transparent", border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", fontSize:12, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"left", letterSpacing:0.2 }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {op.key === "informe" && generandoPDF ? t("generando") : op.label}
                  </button>
                ))}
                <button onClick={handleLogout}
                  style={{ width:"100%", display:"flex", alignItems:"center", padding:"10px 16px", background:"transparent", border:"none", borderTop:`1px solid ${C.border}`, cursor:"pointer", fontSize:12, color:C.red, fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"left", letterSpacing:0.2 }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.redLight}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {t("cerrar_sesion")}
                </button>
              </div>
            )}
          </div>

          <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem("fr_lang", e.target.value); }}
            style={{ border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 8px", fontSize:11, fontWeight:500, color:C.text, background:C.bgCard, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div></header>

      <WeatherBar ciudad={datos.hotel?.ciudad} datos={datos} />

      {/* Main */}
      <main id="main-scroll" onScroll={e => localStorage.setItem("fr_scroll", e.currentTarget.scrollTop)} style={{ padding: "clamp(14px,4vw,28px) clamp(12px,4vw,32px)", width: "100%", boxSizing: "border-box" }}>


        {cargandoDatos ? <LoadingSpinner /> : mesDetalle ? (
          <div style={{ width:"100%" }}><MonthDetailView datos={datos} mes={mesDetalle.mes} anio={mesDetalle.anio} onBack={() => setMesDetalle(null)} /></div>
        ) : (
          <div style={{ width:"100%" }}><View datos={datos} mes={mesSel} anio={anioSel} onGuardado={cargarDatos} onPeriodo={(m,a) => { setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes", m); localStorage.setItem("rm_anio", a); }} /></div>
        )}
      </main>


      {/* Modal Suscripción */}
      {perfilSeccion === "suscripcion" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:440, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.text }}>Gestión de suscripción</h2>
              <button onClick={()=>{ setPerfilSeccion(null); setConfirmCancelar(false); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
            </div>

            {/* Datos del plan */}
            <div style={{ background:C.bg, borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.textMid }}>Plan</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:"capitalize" }}>{suscripcion?.plan || "—"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.textMid }}>Estado</span>
                <span style={{ fontSize:12, fontWeight:700, color:
                  suscripcion?.estado === "activa" || suscripcion?.estado === "trial" ? C.green :
                  suscripcion?.estado === "cancelando" ? C.gold : C.red }}>
                  {suscripcion?.estado === "trial" ? "Periodo de prueba"
                    : suscripcion?.estado === "activa" ? "Activa"
                    : suscripcion?.estado === "cancelando" ? "Cancelación programada"
                    : suscripcion?.estado || "—"}
                </span>
              </div>
              {suscripcion?.trial_end && suscripcion.estado === "trial" && (
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Prueba hasta</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.trial_end).toLocaleDateString("es-ES")}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "activa" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Próxima renovación</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "cancelando" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Acceso hasta</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</span>
                </div>
              )}
            </div>

            {/* Badge plan */}
            <div style={{ background:C.accentLight, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:C.accent }}>FastRevenue Básico</p>
                <p style={{ fontSize:11, color:C.textMid }}>€49/mes + IVA</p>
              </div>
              <span style={{ fontSize:11, fontWeight:600,
                color: suscripcion?.estado === "cancelando" ? C.gold : C.green,
                background: suscripcion?.estado === "cancelando" ? "#FEF3C7" : C.greenLight,
                padding:"3px 10px", borderRadius:20 }}>
                {suscripcion?.estado === "cancelando" ? "Cancela pronto" : "Activo"}
              </span>
            </div>

            {/* Aviso cancelación programada */}
            {suscripcion?.estado === "cancelando" && (
              <div style={{ background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                <p style={{ fontSize:12, color:"#92400E", lineHeight:1.6 }}>
                  Tu suscripción se cancelará el <strong>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</strong>. Seguirás teniendo acceso completo hasta esa fecha.
                </p>
              </div>
            )}

            {/* Confirmación cancelar */}
            {confirmCancelar && suscripcion?.estado !== "cancelando" ? (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"16px", marginBottom:16 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:6 }}>¿Confirmas la cancelación?</p>
                <p style={{ fontSize:12, color:"#7F1D1D", lineHeight:1.6, marginBottom:14 }}>
                  No se realizarán más cargos. Mantendrás el acceso hasta el final del período actual ({suscripcion?.periodo_fin ? new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES") : "fin del período"}).
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setConfirmCancelar(false)}
                    style={{ flex:1, padding:"9px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Volver
                  </button>
                  <button
                    disabled={cancelandoSub}
                    onClick={async () => {
                      setCancelandoSub(true);
                      try {
                        const res = await fetch("/api/cancel-subscription", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
                          body: JSON.stringify({}),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error);
                        setSuscripcion(s => ({ ...s, estado: "cancelando", periodo_fin: json.periodo_fin }));
                        setConfirmCancelar(false);
                      } catch(e) {
                        console.error("Error al cancelar:", e);
                      }
                      setCancelandoSub(false);
                    }}
                    style={{ flex:1, padding:"9px", borderRadius:8, border:"none", background:C.red, color:"#fff", fontSize:13, fontWeight:700, cursor:cancelandoSub?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {cancelandoSub ? "Cancelando..." : "Sí, cancelar"}
                  </button>
                </div>
              </div>
            ) : suscripcion?.estado !== "cancelando" ? (
              <button onClick={()=>setConfirmCancelar(true)}
                style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.red, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
                Cancelar suscripción
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal Extranets */}
      {perfilSeccion === "extranets" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:480, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.text }}>Extranets</h2>
              <button onClick={()=>setPerfilSeccion(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
            </div>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:24 }}>Accede directamente a la extranet de cada canal</p>
            {[
              { nombre:"Brand Web", desc:"Motor de reservas directo", url:"#", logo:"🌐", color:"#004B87" },
              { nombre:"Booking.com", desc:"Extranet de Booking.com", url:"https://admin.booking.com", logo:"🔵", color:"#003580" },
              { nombre:"Expedia", desc:"Extranet de Expedia Group", url:"https://www.expediapartnercentral.com", logo:"🟡", color:"#FFD700" },
            ].map((ex, i) => (
              <a key={i} href={ex.url} target={ex.url==="#"?"_self":"_blank"} rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:10, border:`1px solid ${C.border}`, marginBottom:10, textDecoration:"none", background:C.bg, transition:"all 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.accentLight; e.currentTarget.style.borderColor=C.accent; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border; }}>
                <div style={{ width:40, height:40, borderRadius:8, background:ex.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{ex.logo}</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{ex.nombre}</p>
                  <p style={{ fontSize:11, color:C.textMid }}>{ex.desc}</p>
                </div>
                <span style={{ fontSize:11, color:C.textLight }}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {importar && <ImportarExcel onClose={() => setImportar(false)} session={session} hotelNombre={datos.hotel?.nombre || ''} onImportado={() => { sessionStorage.removeItem("fr_datos_cache_v3"); sessionStorage.removeItem("fr_datos_ts_v3"); localStorage.removeItem("fr_scroll"); cargarDatos(true); }} />}
      {onboardingStep !== null && <OnboardingOverlay step={onboardingStep} onNext={handleOnboardingNext} onSkip={handleOnboardingSkip} />}
    </div>
    </LangContext.Provider>
  );
}