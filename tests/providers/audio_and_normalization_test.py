import json
import pathlib
import sys
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'providers/python'))
from autobyteus_voice_provider.audio import InvalidAudio,read_audio
from autobyteus_voice_provider.normalization import TranscriptNormalizer
class ProviderCoreTest(unittest.TestCase):
    def test_audio_contract(self):
        self.assertTrue(read_audio(ROOT/'contracts/audio/fixtures/silence.wav').no_speech)
        self.assertFalse(read_audio(ROOT/'contracts/audio/fixtures/speech.wav').no_speech)
        for name in ['malformed.wav','stereo.wav','too-short.wav','truncated.wav','wrong-rate.wav']:
            with self.assertRaises(InvalidAudio,msg=name): read_audio(ROOT/'contracts/audio/fixtures'/name)
    def test_normalization_fixtures(self):
        mapping=ROOT/'contracts/normalization/twp-to-cn-v1.json'
        fixtures=json.loads((ROOT/'contracts/normalization/fixtures-v1.json').read_text())['fixtures']
        for fixture in fixtures:
            normalizer=TranscriptNormalizer(fixture['profileId'],mapping if fixture['profileId']!='english' else None)
            self.assertEqual(normalizer.normalize(fixture['raw']),fixture['normalized'],fixture['id'])
if __name__=='__main__': unittest.main()
